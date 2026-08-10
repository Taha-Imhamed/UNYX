import type { Request, Response, NextFunction } from 'express'
import { getModuleState, getLockMessage } from '../routes/terminal.js'

const API_PREFIX_MODULE_MAP: Record<string, string> = {
  '/api/students': 'students',
  '/api/enrollments': 'enrollment',
  '/api/professors': 'professors',
  '/api/finance': 'finance',
  '/api/payments': 'finance',
  '/api/coupons': 'finance',
  '/api/income': 'finance',
  '/api/expenses': 'finance',
  '/api/admissions': 'applications',
  '/api/news': 'news',
  '/api/feedback': 'feedback',
  '/api/facilities': 'facilities',
  '/api/research-office': 'research-office',
  '/api/registrar': 'registrar',
  '/api/security': 'security',
  '/api/it-admin': 'it-admin',
  '/api/users': 'users',
}

function moduleKeyForPath(path: string): string | null {
  for (const [prefix, moduleKey] of Object.entries(API_PREFIX_MODULE_MAP)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return moduleKey
  }
  return null
}

const EXEMPT_PATHS = new Set(['/api/users/auth/login', '/api/health'])

export async function enforceModuleGate(req: Request, res: Response, next: NextFunction) {
  const rawPath = req.originalUrl.split('?')[0]
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath

  if (EXEMPT_PATHS.has(path)) return next()
  if (req.auth?.role === 'super-admin') return next()

  const moduleKey = moduleKeyForPath(path)
  if (!moduleKey) return next()

  try {
    const state = await getModuleState(moduleKey)
    if (state === 'open') return next()

    const message = await getLockMessage()
    return res.status(423).json({
      success: false,
      error: message,
      locked: true,
      moduleKey,
    })
  } catch (error) {
    console.warn('[module-gate] failed to check module state, allowing request', error)
    return next()
  }
}
