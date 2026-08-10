import type { AccessProfile, CustomRoleTemplate, Permission, SystemRole, User } from '@shared/types'
import { apiFetch } from './api-client'

export function fetchUsers(signal?: AbortSignal) {
  return apiFetch<User[]>(`/users`, { signal })
}

export function createUser(payload: {
  username: string
  email: string
  role: SystemRole
  secondaryRoles?: SystemRole[]
  password: string
  avatarUrl?: string | null
  permissions?: Partial<Record<Permission, boolean>>
  customRoleId?: string | null
  customRoleName?: string | null
  accessProfile?: AccessProfile
  studentId?: string | null
  professorId?: string | null
  student?: Record<string, unknown>
  professor?: Record<string, unknown>
}) {
  return apiFetch<User>(`/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateUser(
  id: string,
  payload: Partial<
    Pick<User, 'username' | 'email' | 'role' | 'status' | 'avatarUrl' | 'permissions' | 'customRoleId' | 'customRoleName' | 'accessProfile' | 'studentId' | 'professorId'> & {
      secondaryRoles?: SystemRole[]
      student?: Record<string, unknown>
      professor?: Record<string, unknown>
    }
  >,
) {
  return apiFetch<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id: string) {
  return apiFetch<void>(`/users/${id}`, {
    method: 'DELETE',
  })
}

export function fetchCustomRoles(signal?: AbortSignal) {
  return apiFetch<CustomRoleTemplate[]>(`/users/custom-roles`, { signal })
}

export function createCustomRole(payload: {
  name: string
  description?: string | null
  baseRole: SystemRole
  permissions?: Partial<Record<Permission, boolean>>
  accessProfile?: AccessProfile
}) {
  return apiFetch<CustomRoleTemplate>(`/users/custom-roles`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateCustomRole(
  id: string,
  payload: {
    name: string
    description?: string | null
    baseRole: SystemRole
    permissions?: Partial<Record<Permission, boolean>>
    accessProfile?: AccessProfile
  },
) {
  return apiFetch<CustomRoleTemplate>(`/users/custom-roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteCustomRole(id: string) {
  return apiFetch<void>(`/users/custom-roles/${id}`, {
    method: 'DELETE',
  })
}
