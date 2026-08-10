import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads'
import { createHmac } from 'node:crypto'
import os from 'node:os'
import { performance } from 'node:perf_hooks'

function envNumber(name, fallback) {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function signStudentToken(secret, studentId) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const header = { alg: 'HS256', typ: 'JWT' }
  const payload = {
    userId: studentId,
    username: `stress-${studentId}`,
    role: 'student',
    studentId,
    iat: nowSeconds,
    exp: nowSeconds + 60 * 30,
  }
  const encodedHeader = base64Url(JSON.stringify(header))
  const encodedPayload = base64Url(JSON.stringify(payload))
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${encodedHeader}.${encodedPayload}.${signature}`
}

function percentile(values, percentileValue) {
  if (values.length === 0) return 0
  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))]
}

async function enrollOne(config, studentId) {
  const token = config.mode === 'admin'
    ? config.adminToken
    : signStudentToken(config.jwtSecret, studentId)
  const path = config.mode === 'admin' ? '/enrollments' : '/enrollments/self'
  const body = config.mode === 'admin'
    ? { studentId, courseId: config.courseId, status: config.status }
    : { courseId: config.courseId }
  const startedAt = performance.now()
  try {
    const response = await fetch(`${config.apiBase}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const durationMs = performance.now() - startedAt
    const payload = await response.json().catch(() => ({}))
    return {
      studentId,
      ok: response.ok,
      statusCode: response.status,
      durationMs,
      enrollmentStatus: payload?.data?.status ?? null,
      error: payload?.error ?? null,
    }
  } catch (error) {
    return {
      studentId,
      ok: false,
      statusCode: 0,
      durationMs: performance.now() - startedAt,
      enrollmentStatus: null,
      error: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

async function runWorker() {
  const { config, studentIds } = workerData
  const results = await Promise.all(studentIds.map((studentId) => enrollOne(config, studentId)))
  parentPort?.postMessage(results)
}

async function runMain() {
  const apiBase = (process.env.STRESS_API_BASE_URL ?? 'http://localhost:3001/api').replace(/\/$/, '')
  const courseId = process.env.STRESS_COURSE_ID
  const jwtSecret = process.env.STRESS_JWT_SECRET ?? process.env.JWT_SECRET
  const mode = process.env.STRESS_MODE === 'admin' ? 'admin' : 'self'
  const adminToken = process.env.STRESS_ADMIN_TOKEN
  const status = process.env.STRESS_REQUESTED_STATUS ?? undefined
  const studentIds = (process.env.STRESS_STUDENT_IDS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  if (!courseId) {
    throw new Error('Set STRESS_COURSE_ID to the 30-seat course id.')
  }
  if (mode === 'self' && !jwtSecret) {
    throw new Error('Set STRESS_JWT_SECRET or JWT_SECRET to the backend JWT secret.')
  }
  if (mode === 'admin' && !adminToken) {
    throw new Error('Set STRESS_ADMIN_TOKEN when STRESS_MODE=admin.')
  }
  if (studentIds.length < 500) {
    throw new Error(`Set STRESS_STUDENT_IDS to at least 500 comma-separated student ids. Received ${studentIds.length}.`)
  }

  const totalUsers = envNumber('STRESS_USERS', 500)
  const expectedCapacity = envNumber('STRESS_EXPECTED_CAPACITY', 30)
  const p95TargetMs = envNumber('STRESS_P95_TARGET_MS', 200)
  const workerCount = Math.min(envNumber('STRESS_WORKERS', Math.max(4, os.cpus().length * 4)), totalUsers)
  const selectedStudentIds = studentIds.slice(0, totalUsers)
  const shards = Array.from({ length: workerCount }, () => [])
  selectedStudentIds.forEach((studentId, index) => {
    shards[index % workerCount].push(studentId)
  })

  const config = { apiBase, courseId, jwtSecret, mode, adminToken, status }
  const startedAt = performance.now()
  const results = (
    await Promise.all(
      shards
        .filter((shard) => shard.length > 0)
        .map(
          (shard) =>
            new Promise((resolve, reject) => {
              const worker = new Worker(new URL(import.meta.url), {
                workerData: { config, studentIds: shard },
              })
              worker.once('message', resolve)
              worker.once('error', reject)
              worker.once('exit', (code) => {
                if (code !== 0) reject(new Error(`Worker exited with code ${code}`))
              })
            }),
        ),
    )
  ).flat()

  const durationMs = performance.now() - startedAt
  const latencies = results.map((result) => result.durationMs)
  const p95Ms = percentile(latencies, 95)
  const created = results.filter((result) => result.statusCode === 201)
  const statusCounts = created.reduce((counts, result) => {
    const key = result.enrollmentStatus ?? 'unknown'
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
  const nonWaitlisted = created.filter((result) => result.enrollmentStatus !== 'waitlisted')
  const waitlisted = created.filter((result) => result.enrollmentStatus === 'waitlisted')
  const failures = results.filter((result) => !result.ok)

  const summary = {
    apiBase,
    courseId,
    mode,
    requestedStatus: status ?? null,
    totalUsers,
    workerCount,
    durationMs: Number(durationMs.toFixed(2)),
    p95Ms: Number(p95Ms.toFixed(2)),
    p95TargetMs,
    expectedCapacity,
    created: created.length,
    nonWaitlisted: nonWaitlisted.length,
    waitlisted: waitlisted.length,
    failures: failures.length,
    statusCounts,
    sampleFailures: failures.slice(0, 10).map((failure) => ({
      studentId: failure.studentId,
      statusCode: failure.statusCode,
      error: failure.error,
      durationMs: Number(failure.durationMs.toFixed(2)),
    })),
  }

  console.log(JSON.stringify(summary, null, 2))

  if (nonWaitlisted.length > expectedCapacity) {
    throw new Error(`Overbooking detected: ${nonWaitlisted.length} non-waitlisted enrollments for ${expectedCapacity} seats.`)
  }
  if (created.length >= expectedCapacity + 1 && waitlisted.length === 0) {
    throw new Error('Waitlist behavior was not observed after capacity was reached.')
  }
  if (p95Ms > p95TargetMs) {
    throw new Error(`p95 latency ${p95Ms.toFixed(2)}ms exceeded target ${p95TargetMs}ms.`)
  }
}

if (isMainThread) {
  runMain().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
} else {
  runWorker().catch((error) => {
    parentPort?.postMessage([
      {
        studentId: 'worker',
        ok: false,
        statusCode: 0,
        durationMs: 0,
        enrollmentStatus: null,
        error: error instanceof Error ? error.message : 'Worker failed',
      },
    ])
  })
}
