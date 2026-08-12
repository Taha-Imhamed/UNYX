import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { getCollection, invalidateTableCache, runDbQuery } from '../db/postgres.js'
import type { SupportTicket, TicketReply, TicketDepartment, TicketCategory, SystemRole, User, UserNotification } from '../../../shared/types/index.js'
import { TICKET_DEPARTMENT_ROLES, TICKET_DEPARTMENT_LABELS, departmentForRole } from '../lib/ticket-departments.js'
import { logger } from '../lib/logger.js'

export const supportTicketRoutes: ReturnType<typeof Router> = Router()

const DEPARTMENTS = Object.keys(TICKET_DEPARTMENT_LABELS) as TicketDepartment[]
const CATEGORIES: TicketCategory[] = ['technical', 'account-access', 'academic', 'billing', 'facility', 'other']
const STATUSES = ['open', 'in-progress', 'resolved', 'closed'] as const

function buildId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`
}

// The column-mapped ORM (getCollection) requires the table+columns to already exist —
// it silently drops writes for unmapped columns rather than creating them. So every new
// collection needs its own "create table if not exists" here, matching finance.ts's
// ensureFinanceStorage() pattern, run before the table is first touched.
//
// Table names are prefixed support_desk_* rather than support_ticket* because the DB
// already has unrelated placeholder tables named support_tickets/support_ticket_messages
// (generic id/title/description/status/notes stub columns, referenced by a diagnostics
// health-check probe in system-diagnostics.ts) — reusing those names would either silently
// drop our real columns or corrupt that probe's fixture table.
const TICKETS_TABLE = 'support_desk_tickets'
const REPLIES_TABLE = 'support_desk_replies'

let schemaReady = false

async function ensureTicketStorage() {
  if (schemaReady) return
  await runDbQuery(`
    create table if not exists public.${TICKETS_TABLE} (
      id text primary key,
      ticket_number text not null,
      requester_id text not null,
      requester_name text not null,
      requester_role text not null,
      department text not null,
      category text not null,
      subject text not null,
      description text not null,
      status text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      closed_at timestamptz null,
      last_reply_at timestamptz null,
      last_reply_by_role text null
    )
  `)
  await runDbQuery(`
    create table if not exists public.${REPLIES_TABLE} (
      id text primary key,
      ticket_id text not null,
      author_id text not null,
      author_name text not null,
      author_role text not null,
      body text not null,
      created_at timestamptz not null default now()
    )
  `)
  await runDbQuery(`create index if not exists idx_${REPLIES_TABLE}_ticket_id on public.${REPLIES_TABLE} (ticket_id)`)
  invalidateTableCache(TICKETS_TABLE)
  invalidateTableCache(REPLIES_TABLE)
  schemaReady = true
}

async function ticketsCollection() {
  await ensureTicketStorage()
  return getCollection<SupportTicket>(TICKETS_TABLE)
}

async function repliesCollection() {
  await ensureTicketStorage()
  return getCollection<TicketReply>(REPLIES_TABLE)
}

function isAdmin(role?: string) {
  return role === 'admin' || role === 'super-admin'
}

// Whether this caller is staff for the ticket's department (sees it in their inbox) —
// admins bypass this entirely and see every ticket regardless of department.
function isDepartmentStaff(role: string | undefined, department: TicketDepartment) {
  if (!role) return false
  return (TICKET_DEPARTMENT_ROLES[department] ?? []).includes(role as SystemRole)
}

function canSeeTicket(ticket: SupportTicket, auth?: { userId?: string; role?: string }) {
  if (!auth) return false
  if (isAdmin(auth.role)) return true
  if (ticket.requesterId === auth.userId) return true
  return isDepartmentStaff(auth.role, ticket.department)
}

async function notifyDepartment(department: TicketDepartment, title: string, body: string, actor: string) {
  try {
    const roles = TICKET_DEPARTMENT_ROLES[department] ?? []
    if (roles.length === 0) return
    const usersCol = await getCollection<User>('users')
    const staff = await usersCol.find({ role: { $in: roles } }).toArray()
    const targets = staff.filter((u) => u.status === 'active')
    if (targets.length === 0) return
    const notificationsCol = await getCollection<UserNotification>('notifications')
    const createdAt = new Date().toISOString()
    await notificationsCol.insertMany(
      targets.map((user) => ({
        id: buildId('TKT-NOTIF'),
        userId: user.id,
        title,
        body,
        createdAt,
        read: false,
        actor,
      })),
    )
  } catch (error) {
    logger.error({ err: error }, '[support-tickets] failed to notify department')
  }
}

async function notifyUser(userId: string, title: string, body: string, actor: string) {
  try {
    const notificationsCol = await getCollection<UserNotification>('notifications')
    await notificationsCol.insertOne({
      id: buildId('TKT-NOTIF'),
      userId,
      title,
      body,
      createdAt: new Date().toISOString(),
      read: false,
      actor,
    })
  } catch (error) {
    logger.error({ err: error }, '[support-tickets] failed to notify requester')
  }
}

supportTicketRoutes.get('/meta', async (_req, res) => {
  res.json({
    success: true,
    data: {
      departments: DEPARTMENTS.map((key) => ({ key, label: TICKET_DEPARTMENT_LABELS[key] })),
      categories: CATEGORIES,
    },
  })
})

// Returns tickets grouped by relationship to the caller: tickets they opened, tickets routed
// to a department they staff, and (admin only) every ticket in the system.
supportTicketRoutes.get('/', async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const col = await ticketsCollection()
    const all = await col.find().sort({ createdAt: -1 }).toArray()

    const mine = all.filter((t) => t.requesterId === req.auth!.userId)
    const staffDepartment = departmentForRole(req.auth!.role)
    const assigned = staffDepartment ? all.filter((t) => t.department === staffDepartment) : []
    const everything = isAdmin(req.auth!.role) ? all : []

    res.json({
      success: true,
      data: {
        mine,
        assigned,
        all: everything,
        myDepartment: staffDepartment,
      },
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch support tickets')
    res.status(500).json({ success: false, error: 'Failed to fetch support tickets' })
  }
})

supportTicketRoutes.get('/:id', async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const col = await ticketsCollection()
    const ticket = await col.findOne({ id: req.params.id })
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' })
    }
    if (!canSeeTicket(ticket, req.auth)) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this ticket' })
    }
    const repliesCol = await repliesCollection()
    const replies = await repliesCol.find({ ticketId: ticket.id }).sort({ createdAt: 1 }).toArray()
    res.json({ success: true, data: { ticket, replies } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch support ticket')
    res.status(500).json({ success: false, error: 'Failed to fetch support ticket' })
  }
})

supportTicketRoutes.post('/', async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const { department, category, subject, description } = req.body ?? {}

    if (!DEPARTMENTS.includes(department)) {
      return res.status(400).json({ success: false, error: 'A valid department is required' })
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: 'A valid category is required' })
    }
    if (typeof subject !== 'string' || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Subject is required' })
    }
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required' })
    }

    const now = new Date().toISOString()
    const requesterName = req.auth.username ?? req.auth.userId

    const ticket: SupportTicket = {
      id: buildId('TKT'),
      ticketNumber: buildId('TICKET'),
      requesterId: req.auth.userId,
      requesterName,
      requesterRole: req.auth.role,
      department,
      category,
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
      createdAt: now,
      updatedAt: now,
      closedAt: null,
      lastReplyAt: null,
      lastReplyByRole: null,
    }

    const col = await ticketsCollection()
    await col.insertOne(ticket)

    await notifyDepartment(
      department,
      `New ticket: ${ticket.subject}`,
      `${requesterName} opened a ${category} ticket for ${TICKET_DEPARTMENT_LABELS[department]}.`,
      requesterName,
    )

    res.status(201).json({ success: true, data: ticket })
  } catch (error) {
    logger.error({ err: error }, 'Failed to create support ticket')
    res.status(500).json({ success: false, error: 'Failed to create support ticket' })
  }
})

supportTicketRoutes.post('/:id/replies', async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const { body } = req.body ?? {}
    if (typeof body !== 'string' || !body.trim()) {
      return res.status(400).json({ success: false, error: 'Reply text is required' })
    }

    const col = await ticketsCollection()
    const ticket = await col.findOne({ id: req.params.id })
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' })
    }
    if (!canSeeTicket(ticket, req.auth)) {
      return res.status(403).json({ success: false, error: 'Not authorized to reply to this ticket' })
    }
    if (ticket.status === 'closed') {
      return res.status(409).json({ success: false, error: 'This ticket is closed' })
    }

    const now = new Date().toISOString()
    const authorName = req.auth.username ?? req.auth.userId
    const reply: TicketReply = {
      id: buildId('TKTREPLY'),
      ticketId: ticket.id,
      authorId: req.auth.userId,
      authorName,
      authorRole: req.auth.role,
      body: body.trim(),
      createdAt: now,
    }

    const repliesCol = await repliesCollection()
    await repliesCol.insertOne(reply)

    const isStaffReply = req.auth.userId !== ticket.requesterId
    await col.updateOne(
      { id: ticket.id },
      {
        $set: {
          updatedAt: now,
          lastReplyAt: now,
          lastReplyByRole: req.auth.role,
          status: isStaffReply && ticket.status === 'open' ? 'in-progress' : ticket.status,
        },
      },
    )

    if (isStaffReply) {
      await notifyUser(ticket.requesterId, `Reply on ticket: ${ticket.subject}`, `${authorName} replied to your ticket.`, authorName)
    } else {
      await notifyDepartment(ticket.department, `Ticket update: ${ticket.subject}`, `${authorName} added a reply.`, authorName)
    }

    const updated = await col.findOne({ id: ticket.id })
    res.status(201).json({ success: true, data: { ticket: updated, reply } })
  } catch (error) {
    logger.error({ err: error }, 'Failed to add ticket reply')
    res.status(500).json({ success: false, error: 'Failed to add ticket reply' })
  }
})

supportTicketRoutes.put('/:id/status', async (req, res) => {
  if (!req.auth?.userId) {
    return res.status(401).json({ success: false, error: 'Authentication required' })
  }
  try {
    const { status } = req.body ?? {}
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, error: 'A valid status is required' })
    }

    const col = await ticketsCollection()
    const ticket = await col.findOne({ id: req.params.id })
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' })
    }

    // Only department staff/admin can change status — the requester can see and reply,
    // but resolving/closing is a staff action.
    const staffAllowed = isAdmin(req.auth.role) || isDepartmentStaff(req.auth.role, ticket.department)
    if (!staffAllowed) {
      return res.status(403).json({ success: false, error: 'Only department staff can change ticket status' })
    }

    const now = new Date().toISOString()
    await col.updateOne(
      { id: ticket.id },
      {
        $set: {
          status,
          updatedAt: now,
          closedAt: status === 'closed' ? now : status === 'resolved' ? ticket.closedAt ?? null : null,
        },
      },
    )

    const updated = await col.findOne({ id: ticket.id })
    if (status === 'resolved' || status === 'closed') {
      const actorName = req.auth.username ?? req.auth.userId
      await notifyUser(ticket.requesterId, `Ticket ${status}: ${ticket.subject}`, `${actorName} marked your ticket as ${status}.`, actorName)
    }

    res.json({ success: true, data: updated })
  } catch (error) {
    logger.error({ err: error }, 'Failed to update ticket status')
    res.status(500).json({ success: false, error: 'Failed to update ticket status' })
  }
})
