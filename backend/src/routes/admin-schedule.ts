import { Router } from 'express'
import type { NextFunction, Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { getCollection, runDbQuery } from '../db/postgres.js'
import { requirePermission } from '../middleware/auth.js'
import type { CourseScheduleEntry, Permission } from '../../../shared/types/index.js'

export const adminScheduleRoutes: ReturnType<typeof Router> = Router()

type CourseRow = {
  id: string
  code?: string | null
  title?: string | null
  professorId?: string | null
  professorName?: string | null
  department?: string | null
  location?: string | null
  branch?: string | null
  schedule?: unknown
}

type AdminScheduleItem = {
  courseId: string
  courseTitle: string
  courseCode?: string | null
  professorId?: string | null
  professorName?: string | null
  campus?: string | null
  room?: string | null
  day: CourseScheduleEntry['day']
  startTime: string
  endTime: string
}

type AuditLogRecord = Record<string, unknown> & {
  id: string
  action: string
  actorUserId?: string | null
  actorUsername?: string | null
  entityType?: string | null
  entityId?: string | null
  createdAt: string
  details: Record<string, unknown>
}

const validDays = new Set<CourseScheduleEntry['day']>([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

const scheduleAccessPermissions: Permission[] = ['ADMIN_VIEW_SCHEDULE', 'MANAGE_RESOURCES']
const resourceManagementPermission: Permission = 'MANAGE_RESOURCES'
const courseIdPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/
const controlCharPattern = /[\u0000-\u001f\u007f]/

function hasAnyPermission(auth: Request['auth'], permissions: Permission[]) {
  if (!auth) return false
  const effective = auth.effectivePermissions ?? []
  return permissions.some((permission) => effective.includes(permission))
}

function requireScheduleAccess(req: Request, res: Response, next: NextFunction) {
  if (!hasAnyPermission(req.auth, scheduleAccessPermissions)) {
    return res.status(403).json({
      success: false,
      error: 'ADMIN_VIEW_SCHEDULE or MANAGE_RESOURCES permission required',
    })
  }
  return next()
}

function requireResourceManagement(req: Request, res: Response, next: NextFunction) {
  if (!hasAnyPermission(req.auth, [resourceManagementPermission])) {
    return res.status(403).json({
      success: false,
      error: 'MANAGE_RESOURCES permission required',
    })
  }
  return next()
}

function normalizeSimpleText(
  value: unknown,
  options: { maxLength: number; allowEmpty?: boolean } = { maxLength: 120 },
) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) {
    return options.allowEmpty ? '' : null
  }
  if (trimmed.length > options.maxLength || controlCharPattern.test(trimmed)) {
    return null
  }
  return trimmed
}

function normalizeCourseId(value: unknown) {
  const trimmed = normalizeSimpleText(value, { maxLength: 80 })
  if (!trimmed || !courseIdPattern.test(trimmed)) return null
  return trimmed
}

function normalizeDay(value: unknown): CourseScheduleEntry['day'] | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toLowerCase()
  return validDays.has(normalized as CourseScheduleEntry['day']) ? (normalized as CourseScheduleEntry['day']) : null
}

function normalizeTime(value: unknown) {
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(normalized) ? normalized : null
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((part) => Number(part))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function parseTimeWindow(startValue: unknown, endValue: unknown) {
  const startTime = normalizeTime(startValue)
  const endTime = normalizeTime(endValue)
  if (!startTime || !endTime) return null

  const startMinutes = timeToMinutes(startTime)
  const endMinutes = timeToMinutes(endTime)
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null
  }

  return { startTime, endTime, startMinutes, endMinutes }
}

function overlapsWindow(slotStart: number, slotEnd: number, windowStart: number, windowEnd: number) {
  return slotStart < windowEnd && slotEnd > windowStart
}

function normalizeStoredText(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(controlCharPattern, '').trim()
}

function normalizeStoredRoom(value: unknown) {
  const normalized = normalizeStoredText(value)
  return normalized.slice(0, 120)
}

function normalizeStoredSchedule(raw: unknown): CourseScheduleEntry[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((entry) => {
    const day = normalizeDay(entry?.day)
    const startTime = normalizeTime(entry?.startTime)
    const endTime = normalizeTime(entry?.endTime)
    if (!day || !startTime || !endTime) {
      return []
    }

    return [
      {
        day,
        startTime,
        endTime,
        location: normalizeStoredRoom(entry?.location),
        department: normalizeStoredText(entry?.department) || undefined,
        branch: normalizeStoredText(entry?.branch) || undefined,
      },
    ]
  })
}

function getCampusForDepartment(department?: string | null) {
  const normalized = (department ?? '').trim().toLowerCase()
  if (!normalized) return 'Main Campus'

  const tokens = normalized.split(/[^a-z0-9]+/).filter(Boolean)
  const tokenSet = new Set(tokens)
  if (
    tokenSet.has('architecture') ||
    tokenSet.has('engineering') ||
    tokenSet.has('cs') ||
    tokenSet.has('computer') ||
    normalized.includes('computer science')
  ) {
    return 'East Campus'
  }

  return 'Main Campus'
}

function getCourseCampus(course: CourseRow) {
  return getCampusForDepartment(course.department)
}

function getRoomForSlot(course: CourseRow, slot: CourseScheduleEntry) {
  return normalizeStoredRoom(slot.location || course.location || course.branch)
}

function buildScheduleItem(course: CourseRow, slot: CourseScheduleEntry): AdminScheduleItem {
  const room = getRoomForSlot(course, slot)
  return {
    courseId: course.id,
    courseTitle: normalizeStoredText(course.title) || course.id,
    courseCode: normalizeStoredText(course.code) || null,
    professorId: normalizeStoredText(course.professorId) || null,
    professorName: normalizeStoredText(course.professorName) || null,
    campus: getCourseCampus(course),
    room: room || null,
    day: slot.day,
    startTime: slot.startTime,
    endTime: slot.endTime,
  }
}

function toCsvCell(value: unknown) {
  const stringValue = typeof value === 'string' ? value : value == null ? '' : String(value)
  return `"${stringValue.replace(/"/g, '""')}"`
}

async function writeCsvLine(res: Response, values: unknown[]) {
  const line = `${values.map((value) => toCsvCell(value)).join(',')}\n`
  if (!res.write(line)) {
    await once(res, 'drain')
  }
}

async function ensureAuditLogStorage() {
  await runDbQuery(`
    create table if not exists public.audit_logs (
      id text primary key,
      action text not null,
      actor_user_id text null,
      actor_username text null,
      entity_type text null,
      entity_id text null,
      details jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `)

  await runDbQuery(`create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc)`)
  await runDbQuery(`create index if not exists idx_audit_logs_entity_id on public.audit_logs (entity_id)`)
}

async function auditLogsCollection() {
  await ensureAuditLogStorage()
  return getCollection<AuditLogRecord>('audit_logs')
}

type RoomRecord = {
  id: string
  name: string
  campus: string | null
  capacity: number
  createdAt: string
}

async function ensureRoomsStorage() {
  await runDbQuery(`
    create table if not exists public.rooms (
      id text primary key,
      name text not null,
      campus text null,
      capacity integer not null default 0,
      created_at timestamptz not null default now()
    )
  `)
  await runDbQuery(`create index if not exists idx_rooms_campus on public.rooms (campus)`)
}

async function roomsCollection() {
  await ensureRoomsStorage()
  return getCollection<RoomRecord>('rooms')
}

async function forEachCourseBatch(visitor: (course: CourseRow) => Promise<void> | void) {
  const batchSize = 200
  let lastSeenId: string | null = null

  for (;;) {
    const { rows } = await runDbQuery<CourseRow>(
      `
        select
          id,
          code,
          title,
          professor_id as "professorId",
          professor_name as "professorName",
          department,
          location,
          branch,
          schedule
        from public.courses
        where ($2::text is null or id > $2)
        order by id asc
        limit $1
      `,
      [batchSize, lastSeenId],
    )

    if (rows.length === 0) {
      return
    }

    for (const row of rows) {
      await visitor(row)
    }

    lastSeenId = rows[rows.length - 1]?.id ?? null
    if (rows.length < batchSize) {
      return
    }
  }
}

adminScheduleRoutes.get('/schedule/at-time', requireScheduleAccess, async (req, res) => {
  try {
    const day = normalizeDay(req.query.day)
    const startTime = normalizeTime(req.query.startTime)
    const endTime = req.query.endTime === undefined ? null : normalizeTime(req.query.endTime)

    if (!day) {
      return res.status(400).json({ success: false, error: 'Invalid day parameter' })
    }

    if (!startTime) {
      return res.status(400).json({ success: false, error: 'Invalid startTime parameter' })
    }

    const startMinutes = timeToMinutes(startTime)
    if (startMinutes === null) {
      return res.status(400).json({ success: false, error: 'Invalid startTime parameter' })
    }

    const timeWindow = endTime
      ? parseTimeWindow(startTime, endTime)
      : {
          startTime,
          endTime: startTime,
          startMinutes,
          endMinutes: startMinutes + 1,
        }

    if (!timeWindow) {
      return res.status(400).json({ success: false, error: 'Invalid endTime window' })
    }

    const items: AdminScheduleItem[] = []

    await forEachCourseBatch((course) => {
      const schedule = normalizeStoredSchedule(course.schedule)
      schedule.forEach((slot) => {
        if (slot.day !== day) return

        const slotStart = timeToMinutes(slot.startTime)
        const slotEnd = timeToMinutes(slot.endTime)
        if (slotStart === null || slotEnd === null) return
        if (!overlapsWindow(slotStart, slotEnd, timeWindow.startMinutes, timeWindow.endMinutes)) return

        items.push(buildScheduleItem(course, slot))
      })
    })

    items.sort((left, right) => {
      return (
        (left.campus ?? '').localeCompare(right.campus ?? '') ||
        left.startTime.localeCompare(right.startTime) ||
        left.endTime.localeCompare(right.endTime) ||
        (left.room ?? '').localeCompare(right.room ?? '') ||
        left.courseTitle.localeCompare(right.courseTitle)
      )
    })

    return res.json({ success: true, data: items })
  } catch (error) {
    console.error('Failed to fetch schedule at time', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch schedule at time' })
  }
})

adminScheduleRoutes.get('/schedule/available-rooms', requireScheduleAccess, async (req, res) => {
  try {
    const day = normalizeDay(req.query.day)
    const timeWindow = parseTimeWindow(req.query.startTime, req.query.endTime)
    const campusFilter = normalizeSimpleText(req.query.campus, { maxLength: 80, allowEmpty: true })
    const minCapacityRaw = Number(req.query.minCapacity)
    const minCapacity = Number.isFinite(minCapacityRaw) && minCapacityRaw > 0 ? Math.floor(minCapacityRaw) : 0

    if (!day) {
      return res.status(400).json({ success: false, error: 'Invalid day parameter' })
    }

    if (!timeWindow) {
      return res.status(400).json({ success: false, error: 'Invalid startTime or endTime window' })
    }

    if (campusFilter === null) {
      return res.status(400).json({ success: false, error: 'Invalid campus parameter' })
    }

    const normalizedCampusFilter = campusFilter.toLowerCase()
    const rooms = new Set<string>()
    const busyRooms = new Set<string>()

    await forEachCourseBatch((course) => {
      const campus = getCourseCampus(course)
      if (normalizedCampusFilter && campus.toLowerCase() !== normalizedCampusFilter) {
        return
      }

      const schedule = normalizeStoredSchedule(course.schedule)
      schedule.forEach((slot) => {
        if (slot.day !== day) return

        const room = getRoomForSlot(course, slot)
        if (room) {
          rooms.add(room)
        }

        const slotStart = timeToMinutes(slot.startTime)
        const slotEnd = timeToMinutes(slot.endTime)
        if (slotStart === null || slotEnd === null || !room) return
        if (overlapsWindow(slotStart, slotEnd, timeWindow.startMinutes, timeWindow.endMinutes)) {
          busyRooms.add(room)
        }
      })
    })

    let available = Array.from(rooms)
      .filter((room) => !busyRooms.has(room))
      .sort((left, right) => left.localeCompare(right))

    if (minCapacity > 0) {
      const roomsCol = await roomsCollection()
      const registeredRooms = await roomsCol.find({ name: { $in: available } } as any).toArray()
      const capacityByName = new Map(registeredRooms.map((room) => [room.name, room.capacity]))
      // Rooms not yet registered in the canonical table pass through unfiltered
      // rather than being silently dropped, since capacity data may be missing.
      available = available.filter((room) => {
        const capacity = capacityByName.get(room)
        return capacity === undefined || capacity >= minCapacity
      })
    }

    return res.json({ success: true, data: available })
  } catch (error) {
    console.error('Failed to fetch available rooms', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch available rooms' })
  }
})

adminScheduleRoutes.get(
  '/schedule/report.csv',
  requireScheduleAccess,
  requirePermission('reports:export'),
  async (_req, res) => {
    let responseClosed = false
    res.on('close', () => {
      responseClosed = true
    })

    try {
      const fileDate = new Date().toISOString().slice(0, 10)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="schedule-report-${fileDate}.csv"`)

      await writeCsvLine(res, [
        'Campus',
        'Day',
        'Start Time',
        'End Time',
        'Course Code',
        'Course Title',
        'Professor',
        'Room',
      ])

      await forEachCourseBatch(async (course) => {
        if (responseClosed) return

        const campus = getCourseCampus(course)
        const schedule = normalizeStoredSchedule(course.schedule)
        const title = normalizeStoredText(course.title) || course.id
        const code = normalizeStoredText(course.code)
        const professorName = normalizeStoredText(course.professorName)

        for (const slot of schedule) {
          if (responseClosed) return

          await writeCsvLine(res, [
            campus,
            slot.day,
            slot.startTime,
            slot.endTime,
            code,
            title,
            professorName,
            getRoomForSlot(course, slot),
          ])
        }
      })

      if (!responseClosed && !res.writableEnded) {
        res.end()
      }
    } catch (error) {
      console.error('Failed to stream schedule report', error)
      if (!res.headersSent) {
        return res.status(500).json({ success: false, error: 'Failed to generate schedule report' })
      }
      if (!res.writableEnded) {
        res.end()
      }
    }
  },
)

adminScheduleRoutes.post('/schedule/update-room', requireResourceManagement, async (req, res) => {
  try {
    const courseId = normalizeCourseId(req.body?.courseId)
    const day = normalizeDay(req.body?.day)
    const timeWindow = parseTimeWindow(req.body?.startTime, req.body?.endTime)
    const oldRoom = normalizeSimpleText(req.body?.oldRoom, { maxLength: 120, allowEmpty: true })
    const newRoom = normalizeSimpleText(req.body?.newRoom, { maxLength: 120 })

    if (!courseId || !day || !timeWindow || oldRoom === null || !newRoom) {
      return res.status(400).json({ success: false, error: 'Invalid room update payload' })
    }

    const coursesCol = await getCollection<Record<string, unknown> & CourseRow>('courses')
    const course = await coursesCol.findOne({ id: courseId })
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' })
    }

    const schedule = normalizeStoredSchedule(course.schedule)
    const normalizedOldRoom = oldRoom.toLowerCase()
    const matchingIndexes = schedule
      .map((slot, index) => ({ slot, index, room: getRoomForSlot(course, slot) }))
      .filter(({ slot }) => slot.day === day && slot.startTime === timeWindow.startTime && slot.endTime === timeWindow.endTime)

    if (matchingIndexes.length === 0) {
      return res.status(404).json({ success: false, error: 'Schedule slot not found' })
    }

    const exactMatch =
      matchingIndexes.find(({ room }) => room.toLowerCase() === normalizedOldRoom) ??
      (normalizedOldRoom ? null : matchingIndexes[0])

    if (!exactMatch) {
      return res.status(409).json({
        success: false,
        error: 'Room assignment changed before this update could be applied',
        data: {
          currentRoom: matchingIndexes[0]?.room ?? null,
        },
      })
    }

    if (exactMatch.room === newRoom) {
      return res.json({
        success: true,
        data: {
          courseId,
          oldRoom: exactMatch.room || null,
          newRoom,
          updatedAt: new Date().toISOString(),
        },
      })
    }

    const normalizedNewRoom = newRoom.toLowerCase()
    const targetCampus = getCourseCampus(course).toLowerCase()
    const roomConflicts: AdminScheduleItem[] = []

    await forEachCourseBatch((otherCourse) => {
      if (otherCourse.id === courseId) return
      if (getCourseCampus(otherCourse).toLowerCase() !== targetCampus) return

      const otherSchedule = normalizeStoredSchedule(otherCourse.schedule)
      otherSchedule.forEach((slot) => {
        if (slot.day !== day) return

        const slotStart = timeToMinutes(slot.startTime)
        const slotEnd = timeToMinutes(slot.endTime)
        if (slotStart === null || slotEnd === null) return
        if (!overlapsWindow(slotStart, slotEnd, timeWindow.startMinutes, timeWindow.endMinutes)) return

        const otherRoom = getRoomForSlot(otherCourse, slot)
        if (otherRoom.toLowerCase() === normalizedNewRoom) {
          roomConflicts.push(buildScheduleItem(otherCourse, slot))
        }
      })
    })

    if (roomConflicts.length > 0) {
      const auditLogsCol = await auditLogsCollection()
      const timestamp = new Date().toISOString()
      await auditLogsCol.insertOne({
        id: `AUD-${randomUUID().slice(0, 8).toUpperCase()}`,
        action: 'resource_overlap_rejected',
        actorUserId: req.auth?.userId ?? null,
        actorUsername: req.auth?.username ?? null,
        entityType: 'course',
        entityId: courseId,
        createdAt: timestamp,
        details: {
          reasonCode: 'resource_overlap',
          reason: `Room ${newRoom} is already booked for this slot.`,
          resourceType: 'room',
          courseId,
          courseCode: normalizeStoredText(course.code) || null,
          courseTitle: normalizeStoredText(course.title) || courseId,
          campus: getCourseCampus(course),
          day,
          startTime: timeWindow.startTime,
          endTime: timeWindow.endTime,
          attemptedRoom: newRoom,
          conflicts: roomConflicts.map((conflict) => ({
            courseId: conflict.courseId,
            courseTitle: conflict.courseTitle,
            professorName: conflict.professorName ?? null,
            room: conflict.room ?? null,
            startTime: conflict.startTime,
            endTime: conflict.endTime,
          })),
        },
      })

      return res.status(409).json({
        success: false,
        error: `Room ${newRoom} is already booked for this slot.`,
        data: {
          conflicts: roomConflicts,
        },
      })
    }

    const nextSchedule = schedule.map((slot, index) => (
      index === exactMatch.index
        ? {
            ...slot,
            location: newRoom,
          }
        : slot
    ))

    await coursesCol.updateOne({ id: courseId }, { $set: { schedule: nextSchedule } })

    const auditLogsCol = await auditLogsCollection()
    const timestamp = new Date().toISOString()
    await auditLogsCol.insertOne({
      id: `AUD-${randomUUID().slice(0, 8).toUpperCase()}`,
      action: 'schedule.room_changed',
      actorUserId: req.auth?.userId ?? null,
      actorUsername: req.auth?.username ?? null,
      entityType: 'course',
      entityId: courseId,
      createdAt: timestamp,
      details: {
        source: 'quick_suggest',
        courseId,
        courseCode: normalizeStoredText(course.code) || null,
        courseTitle: normalizeStoredText(course.title) || courseId,
        campus: getCourseCampus(course),
        day,
        startTime: timeWindow.startTime,
        endTime: timeWindow.endTime,
        previousRoom: exactMatch.room || null,
        newRoom,
      },
    })

    return res.json({
      success: true,
      data: {
        courseId,
        oldRoom: exactMatch.room || null,
        newRoom,
        updatedAt: timestamp,
      },
    })
  } catch (error) {
    console.error('Failed to update course room', error)
    return res.status(500).json({ success: false, error: 'Failed to update room assignment' })
  }
})

adminScheduleRoutes.get('/rooms', requireScheduleAccess, async (req, res) => {
  try {
    const campusFilter = normalizeSimpleText(req.query.campus, { maxLength: 80, allowEmpty: true })
    const collection = await roomsCollection()
    const query: Record<string, unknown> = campusFilter ? { campus: campusFilter } : {}
    const rooms = await collection.find(query as any).sort({ name: 1 }).toArray()
    return res.json({ success: true, data: rooms })
  } catch (error) {
    console.error('Failed to fetch rooms', error)
    return res.status(500).json({ success: false, error: 'Failed to fetch rooms' })
  }
})

adminScheduleRoutes.post('/rooms', requireResourceManagement, async (req, res) => {
  try {
    const name = normalizeSimpleText(req.body?.name, { maxLength: 120 })
    const campus = normalizeSimpleText(req.body?.campus, { maxLength: 80, allowEmpty: true })
    const capacityRaw = Number(req.body?.capacity)
    const capacity = Number.isFinite(capacityRaw) && capacityRaw >= 0 ? Math.floor(capacityRaw) : 0

    if (!name) {
      return res.status(400).json({ success: false, error: 'Room name is required' })
    }

    const collection = await roomsCollection()
    const existing = await collection.findOne({ name })
    if (existing) {
      return res.status(409).json({ success: false, error: 'A room with this name already exists' })
    }

    const room: RoomRecord = {
      id: `room-${randomUUID().slice(0, 8)}`,
      name,
      campus: campus || null,
      capacity,
      createdAt: new Date().toISOString(),
    }
    await collection.insertOne(room)
    return res.status(201).json({ success: true, data: room })
  } catch (error) {
    console.error('Failed to create room', error)
    return res.status(500).json({ success: false, error: 'Failed to create room' })
  }
})

adminScheduleRoutes.put('/rooms/:id', requireResourceManagement, async (req, res) => {
  try {
    const collection = await roomsCollection()
    const existing = await collection.findOne({ id: req.params.id })
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Room not found' })
    }

    const updates: Partial<RoomRecord> = {}
    if (req.body?.name !== undefined) {
      const name = normalizeSimpleText(req.body.name, { maxLength: 120 })
      if (!name) {
        return res.status(400).json({ success: false, error: 'Room name cannot be empty' })
      }
      updates.name = name
    }
    if (req.body?.campus !== undefined) {
      const campus = normalizeSimpleText(req.body.campus, { maxLength: 80, allowEmpty: true })
      updates.campus = campus || null
    }
    if (req.body?.capacity !== undefined) {
      const capacityRaw = Number(req.body.capacity)
      updates.capacity = Number.isFinite(capacityRaw) && capacityRaw >= 0 ? Math.floor(capacityRaw) : 0
    }

    await collection.updateOne({ id: req.params.id }, { $set: updates })
    const updated = await collection.findOne({ id: req.params.id })
    return res.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update room', error)
    return res.status(500).json({ success: false, error: 'Failed to update room' })
  }
})

adminScheduleRoutes.delete('/rooms/:id', requireResourceManagement, async (req, res) => {
  try {
    const collection = await roomsCollection()
    const result = await collection.deleteOne({ id: req.params.id })
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Room not found' })
    }
    return res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    console.error('Failed to delete room', error)
    return res.status(500).json({ success: false, error: 'Failed to delete room' })
  }
})
