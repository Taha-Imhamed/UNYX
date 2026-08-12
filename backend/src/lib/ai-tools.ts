import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { coursesCollection, professorsCollection } from '../data/collections.js'
import type { AuthContext } from '../middleware/auth.js'
import type { Course, Professor } from '../../../shared/types/index.js'
import { createStudentCoreSchema, createStudentCore } from '../routes/students.js'
import { userCreateSchema, createUserCore, UserCreateConflictError, UserCreateValidationError } from '../routes/users.js'
import { logger } from './logger.js'

// Provider-neutral tool definition shape (JSON Schema properties/required, same as
// both Anthropic's input_schema and Gemini's function-declaration parameters) — kept
// local so this file has no dependency on any model vendor's SDK. routes/ai-assistant.ts
// maps this into whichever shape the active provider's API expects.
export interface AiToolDefinition {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required: string[]
  }
}

export const AI_TOOL_NAMES = ['create_user', 'create_student', 'create_professor', 'create_course'] as const
export type AiToolName = (typeof AI_TOOL_NAMES)[number]

// Only admin/super-admin ever see these definitions — the chat route never includes
// them in the model API call for any other role (see routes/ai-assistant.ts).
export const AI_TOOL_DEFINITIONS: AiToolDefinition[] = [
  {
    name: 'create_user',
    description:
      'Create a new system user login account (staff or admin). Does not create a student or professor profile record by itself unless role is "student" or "professor", in which case a linked profile is auto-created too.',
    input_schema: {
      type: 'object',
      properties: {
        username: { type: 'string', description: 'Login username, must be unique.' },
        email: { type: 'string', description: 'Email address, must be unique.' },
        role: {
          type: 'string',
          description: 'System role for this user.',
          enum: [
            'admin', 'super-admin', 'supervisor', 'user', 'student', 'professor', 'advisor',
            'teaching-assistant', 'registrar', 'admissions', 'finance', 'it-admin', 'dean', 'hod',
            'librarian', 'student-affairs', 'hr', 'security', 'facilities', 'research-office',
          ],
        },
        password: {
          type: 'string',
          description: 'Minimum 4 characters. If the user did not provide one, generate a random secure password and tell them what it is after creation.',
        },
      },
      required: ['username', 'email', 'role', 'password'],
    },
  },
  {
    name: 'create_student',
    description: 'Create a new student record with a login profile.',
    input_schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        program: { type: 'string', description: 'Optional program/major name.' },
      },
      required: ['firstName', 'lastName', 'email'],
    },
  },
  {
    name: 'create_professor',
    description: 'Create a new professor record.',
    input_schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string' },
        lastName: { type: 'string' },
        email: { type: 'string' },
        department: { type: 'string', description: 'Optional department name, defaults to "General".' },
      },
      required: ['firstName', 'lastName', 'email'],
    },
  },
  {
    name: 'create_course',
    description: 'Create a new course.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        code: { type: 'string', description: 'Optional course code, auto-generated from the title if omitted.' },
        professorId: { type: 'string', description: 'Optional; assigns the first available professor if omitted.' },
        capacity: { type: 'number', description: 'Optional, defaults to 20.' },
        price: { type: 'number', description: 'Optional, defaults to 0.' },
        department: { type: 'string' },
      },
      required: ['title'],
    },
  },
]

// Which auth check gates each tool at execution time (propose AND confirm, both
// re-checked independently). v1 restricts the whole tool tier to admin/super-admin —
// see the "Permissions" section of the plan for why this is a role check, not a
// granular Permission string.
export function canUseAiTools(auth?: AuthContext): boolean {
  return auth?.role === 'admin' || auth?.role === 'super-admin'
}

const createUserToolSchema = userCreateSchema.pick({ username: true, email: true, role: true, password: true })
const createStudentToolSchema = createStudentCoreSchema.extend({
  program: z.string().trim().optional(),
})
const createProfessorToolSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  department: z.string().trim().optional(),
})
const createCourseToolSchema = z.object({
  title: z.string().trim().min(1),
  code: z.string().trim().optional(),
  professorId: z.string().trim().optional(),
  capacity: z.coerce.number().finite().optional(),
  price: z.coerce.number().finite().optional(),
  department: z.string().trim().optional(),
})

export class AiToolValidationError extends Error {}
export class AiToolPermissionError extends Error {}

export interface AiToolExecutionResult {
  resultSummary: string
  resultEntityId: string
}

// Validates the proposed tool input against its own schema (never trust the model's
// JSON blindly, even though input_schema already constrains shape) and re-checks the
// caller's role, then dispatches to the real creation logic. Called only from the
// confirm handler in routes/ai-assistant.ts — never from the chat turn itself.
export async function executeAiTool(toolName: string, input: unknown, auth: AuthContext): Promise<AiToolExecutionResult> {
  if (!canUseAiTools(auth)) {
    throw new AiToolPermissionError('Admin privileges required to execute assistant actions')
  }

  switch (toolName as AiToolName) {
    case 'create_user': {
      const parsed = createUserToolSchema.safeParse(input)
      if (!parsed.success) {
        throw new AiToolValidationError(parsed.error.issues[0]?.message ?? 'Invalid create_user input')
      }
      try {
        const user = await createUserCore({
          username: parsed.data.username,
          email: parsed.data.email,
          role: parsed.data.role,
          password: parsed.data.password,
        })
        return { resultSummary: `Created user ${user.username} (role: ${user.role})`, resultEntityId: user.id }
      } catch (error) {
        if (error instanceof UserCreateConflictError || error instanceof UserCreateValidationError) {
          throw new AiToolValidationError(error.message)
        }
        throw error
      }
    }

    case 'create_student': {
      const parsed = createStudentToolSchema.safeParse(input)
      if (!parsed.success) {
        throw new AiToolValidationError(parsed.error.issues[0]?.message ?? 'Invalid create_student input')
      }
      const { firstName, lastName, email, program } = parsed.data
      const student = await createStudentCore({ firstName, lastName, email }, { program })
      return { resultSummary: `Created student ${student.firstName} ${student.lastName}`, resultEntityId: student.id }
    }

    case 'create_professor': {
      const parsed = createProfessorToolSchema.safeParse(input)
      if (!parsed.success) {
        throw new AiToolValidationError(parsed.error.issues[0]?.message ?? 'Invalid create_professor input')
      }
      const { firstName, lastName, email, department } = parsed.data
      const collection = await professorsCollection()
      const professor: Professor = {
        id: `PROF${Date.now()}`,
        firstName,
        lastName,
        email,
        phone: '',
        photo: '/dashboard-red.jpg',
        department: department?.trim() || 'General',
        salary: 0,
        hireDate: new Date().toISOString(),
        specialization: '',
        status: 'active',
      }
      await collection.insertOne(professor)
      return { resultSummary: `Created professor ${professor.firstName} ${professor.lastName}`, resultEntityId: professor.id }
    }

    case 'create_course': {
      const parsed = createCourseToolSchema.safeParse(input)
      if (!parsed.success) {
        throw new AiToolValidationError(parsed.error.issues[0]?.message ?? 'Invalid create_course input')
      }
      const { title, code, professorId, capacity, price, department } = parsed.data

      const profCol = await professorsCollection()
      const professor = professorId
        ? await profCol.findOne({ id: professorId })
        : (await profCol.find({}).sort({ firstName: 1, lastName: 1 }).limit(1).toArray())[0] ?? null
      if (!professor) {
        throw new AiToolValidationError('No professor found to assign this course to — create a professor first or specify professorId')
      }

      const now = new Date()
      const endDate = new Date(now)
      endDate.setDate(endDate.getDate() + 120)
      const normalizedCode = code?.trim() || `CRS-${randomUUID().slice(0, 6).toUpperCase()}`

      const course: Course = {
        id: `CRS-${randomUUID().slice(0, 8).toUpperCase()}`,
        displayId: normalizedCode,
        title,
        code: normalizedCode,
        professorId: professor.id,
        professorName: `${professor.firstName} ${professor.lastName}`,
        capacity: capacity ?? 20,
        startDate: now.toISOString(),
        endDate: endDate.toISOString(),
        price: price ?? 0,
        department: department?.trim() || undefined,
      }

      const coursesCol = await coursesCollection()
      await coursesCol.insertOne(course)
      return { resultSummary: `Created course ${course.title} (${course.code})`, resultEntityId: course.id }
    }

    default:
      logger.warn({ toolName }, '[ai-tools] Unknown tool name proposed by assistant')
      throw new AiToolValidationError(`Unknown tool: ${toolName}`)
  }
}
