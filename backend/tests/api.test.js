// backend/tests/api.test.js
import request from 'supertest'
import jwt from 'jsonwebtoken'

const API_BASE = process.env.API_BASE || 'http://localhost:3001'
const client = request(API_BASE)
const RUN_LIVE_API_TESTS = process.env.TEST_API_LIVE === '1'
const TEST_JWT_SECRET = process.env.TEST_JWT_SECRET || process.env.JWT_SECRET || 'dev-insecure-secret'

let adminToken = ''
let sampleStudentId = ''
let sampleCourseId = ''
let sampleProfessorId = ''
const hasLiveCredentials = Boolean(process.env.TEST_ADMIN_USERNAME && process.env.TEST_ADMIN_PASSWORD)

function tokenFor(payload) {
  return jwt.sign(payload, TEST_JWT_SECRET)
}

beforeAll(async () => {
  const envUser = process.env.TEST_ADMIN_USERNAME
  const envPass = process.env.TEST_ADMIN_PASSWORD

  if (!hasLiveCredentials) {
    return
  }

  const res = await client
    .post('/api/users/auth/login')
    .send({ username: envUser, password: envPass })

  if (res.status !== 200 || !res.body?.data?.token) {
    throw new Error(`Failed to log in with provided admin credentials: ${res.body?.error || `status ${res.status}`}`)
  }

  adminToken = res.body.data.token

  const studentsRes = await client
    .get('/api/students')
    .set('Authorization', `Bearer ${adminToken}`)

  sampleStudentId = studentsRes.body?.data?.[0]?.id
  if (!sampleStudentId) {
    throw new Error('No students found in database for tests')
  }

  const coursesRes = await client
    .get('/api/enrollments/meta/courses')
    .set('Authorization', `Bearer ${adminToken}`)

  sampleCourseId = coursesRes.body?.data?.[0]?.id
  if (!sampleCourseId) {
    throw new Error('No courses found in database for tests')
  }

  const professorsRes = await client
    .get('/api/professors')
    .set('Authorization', `Bearer ${adminToken}`)

  sampleProfessorId = professorsRes.body?.data?.[0]?.id
  if (!sampleProfessorId) {
    throw new Error('No professors found in database for tests')
  }
})

afterAll(async () => {
  // No teardown needed; test database lifecycle handled externally.
})

;(hasLiveCredentials ? describe : describe.skip)('API integration (live data)', () => {
  test('POST /api/enrollments creates an enrollment', async () => {
    const payload = {
      studentId: sampleStudentId,
      courseId: sampleCourseId,
    }

    const res = await client
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)

    expect([201, 409]).toContain(res.status)

    if (res.status === 201) {
      expect(res.body?.success).toBe(true)
      expect(res.body?.data?.id).toBeTruthy()
      expect(res.body?.data?.studentId).toBe(payload.studentId)
    } else {
      // Duplicate-prevention is valid behavior in already-seeded/live environments.
      expect(res.body?.success).toBe(false)
    }
  })

  test('POST /api/students/:id/payments records a payment', async () => {
    const res = await client
      .post(`/api/students/${sampleStudentId}/payments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ amount: 50, method: 'card', note: 'Test payment' })
      .expect(201)

    expect(res.body?.success).toBe(true)
    expect(res.body?.data?.transaction?.type).toBe('credit')
    expect(res.body?.data?.transaction?.studentId).toBe(sampleStudentId)
  })

  test('GET /api/students/:id/grades returns enrollments with grade fields', async () => {
    const res = await client
      .get(`/api/students/${sampleStudentId}/grades`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body?.success).toBe(true)
    expect(Array.isArray(res.body?.data)).toBe(true)
  })

  test('GET /api/dashboard/overview returns dashboard statistics', async () => {
    const res = await client
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)

    expect(res.body?.success).toBe(true)
    const stats = res.body?.data?.stats
    expect(stats).toBeTruthy()
    expect(stats).toHaveProperty('totalStudents')
    expect(stats).toHaveProperty('totalIncome')
    expect(stats).toHaveProperty('netIncome')
  })

  test('POST /api/enrollments rejects professor role', async () => {
    const token = tokenFor({ userId: 'prof-user', username: 'prof', role: 'professor', professorId: sampleProfessorId })
    await client
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ studentId: sampleStudentId, courseId: sampleCourseId })
      .expect(403)
  })

  test('POST /api/enrollments enforces enrollment window', async () => {
    const closedCode = `CLS-${Date.now()}`
    const courseRes = await client
      .post('/api/enrollments/meta/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Closed Window Course',
        code: closedCode,
        professorId: sampleProfessorId,
        capacity: 10,
        startDate: '2025-01-01',
        endDate: '2025-03-01',
        price: 100,
        enrollmentOpenAt: '2020-01-01T00:00:00Z',
        enrollmentCloseAt: '2020-01-02T00:00:00Z',
      })
      .expect(201)

    const courseId = courseRes.body?.data?.id
    expect(courseId).toBeTruthy()

    await client
      .post('/api/enrollments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: sampleStudentId, courseId })
      .expect(409)
  })

  test('POST /api/enrollments/schedule/preview returns sessions', async () => {
    const res = await client
      .post('/api/enrollments/schedule/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: sampleStudentId, sectionIds: [sampleCourseId] })
      .expect(200)

    expect(res.body?.success).toBe(true)
    expect(Array.isArray(res.body?.data?.sessions)).toBe(true)
  })
})

;(RUN_LIVE_API_TESTS ? describe : describe.skip)('API auth and module permission guards', () => {
  test('protected endpoint rejects missing token with 401', async () => {
    const res = await client.get('/api/dashboard/overview').expect(401)
    expect(res.body?.success).toBe(false)
  })

  test('expired or malformed token is rejected with 401', async () => {
    const res = await client
      .get('/api/dashboard/overview')
      .set('Authorization', 'Bearer malformed.jwt.token')
      .expect(401)

    expect(res.body?.success).toBe(false)
    expect(String(res.body?.error || '')).toContain('Authentication failed')
  })

  test.each([
    ['/api/security/visitor-logs', 'Security access required'],
    ['/api/facilities/maintenance-requests', 'Facilities access required'],
    ['/api/research-office/research-grants', 'Research office access required'],
    ['/api/it-admin/sso-config', 'IT admin access required'],
    ['/api/registrar/enrollment-overrides', 'Registrar access required'],
    ['/api/admissions/scholarship-awards', 'Admissions access required'],
  ])('wrong role is blocked for %s', async (path, message) => {
    const token = tokenFor({ userId: 'stu-guard', username: 'student.guard', role: 'student' })
    const res = await client.get(path).set('Authorization', `Bearer ${token}`).expect(403)

    expect(res.body?.success).toBe(false)
    expect(String(res.body?.error || '')).toContain(message)
  })

  test.each([
    ['/api/security/visitor-logs', 'security'],
    ['/api/facilities/maintenance-requests', 'facilities'],
    ['/api/research-office/research-grants', 'research-office'],
    ['/api/it-admin/sso-config', 'it-admin'],
    ['/api/registrar/enrollment-overrides', 'registrar'],
    ['/api/admissions/scholarship-awards', 'admissions'],
  ])('designated role passes guard for %s', async (path, role) => {
    const token = tokenFor({ userId: `${role}-ok`, username: `${role}.ok`, role })
    const res = await client.get(path).set('Authorization', `Bearer ${token}`)

    // 200 with data if DB is available, 500 if DB is unavailable. Either way, role guard passed.
    expect(res.status).not.toBe(401)
    expect(res.status).not.toBe(403)
  })
})
