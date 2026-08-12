import type { SystemRole, TicketDepartment } from '../../../shared/types/index.js'

// Which staff roles see tickets routed to each department. admin/super-admin always see
// everything (handled separately in support-tickets.ts), so they're intentionally omitted here.
export const TICKET_DEPARTMENT_ROLES: Record<TicketDepartment, SystemRole[]> = {
  it: ['it-admin'],
  admin: ['supervisor'],
  finance: ['finance'],
  academic: ['registrar', 'advisor', 'dean', 'hod'],
  facilities: ['facilities'],
  hr: ['hr'],
  security: ['security'],
  library: ['librarian'],
  research: ['research-office'],
}

export const TICKET_DEPARTMENT_LABELS: Record<TicketDepartment, string> = {
  it: 'IT Support',
  admin: 'Admin Office',
  finance: 'Finance',
  academic: 'Academic Affairs',
  facilities: 'Facilities',
  hr: 'HR',
  security: 'Security',
  library: 'Library',
  research: 'Research Office',
}

export function departmentForRole(role?: string): TicketDepartment | null {
  if (!role) return null
  const entry = (Object.entries(TICKET_DEPARTMENT_ROLES) as [TicketDepartment, SystemRole[]][]).find(([, roles]) =>
    roles.includes(role as SystemRole),
  )
  return entry ? entry[0] : null
}
