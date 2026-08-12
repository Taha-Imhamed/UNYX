import { runDbQuery } from '../db/postgres.js'

const STOP_WORDS = new Set(['of', 'and', 'the', 'in', 'for', 'a', 'an'])

/**
 * Turns free-text like "Business Administration" or "Computer Science" into a
 * short uppercase code (e.g. "BIZ"/"BUS", "CS"). Falls back to "GEN" (general)
 * when no usable text is provided.
 */
export function deriveDepartmentCode(source: string | null | undefined): string {
  const cleaned = (source ?? '').trim()
  if (!cleaned) return 'GEN'

  const words = cleaned
    .split(/[\s/-]+/)
    .map((word) => word.trim())
    .filter((word) => word && !STOP_WORDS.has(word.toLowerCase()))

  if (words.length === 0) return 'GEN'

  if (words.length === 1) {
    return words[0].replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase().padEnd(2, 'X') || 'GEN'
  }

  const code = words
    .slice(0, 3)
    .map((word) => word.charAt(0))
    .join('')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()

  return code || 'GEN'
}

const SEQUENCE_WIDTH = 4

/**
 * Builds an id of the form `<ROLE>-<DEPT>-<SEQ>`, e.g. `STU-CS-0042`.
 * The sequence is derived from how many existing rows already share the
 * same role+department prefix, then walked forward until a free slot is
 * found (guards against races/gaps from deleted rows).
 */
export async function generateFormattedId(
  table: string,
  rolePrefix: string,
  departmentSource: string | null | undefined,
): Promise<string> {
  const deptCode = deriveDepartmentCode(departmentSource)
  const prefix = `${rolePrefix}-${deptCode}-`

  const result = await runDbQuery<{ count: string }>(
    `select count(*)::text as count from public.${table} where id like $1`,
    [`${prefix}%`],
  )
  let sequence = Number(result.rows[0]?.count ?? 0) + 1

  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const candidate = `${prefix}${String(sequence).padStart(SEQUENCE_WIDTH, '0')}`
    const existing = await runDbQuery<{ id: string }>(`select id from public.${table} where id = $1 limit 1`, [candidate])
    if (existing.rows.length === 0) {
      return candidate
    }
    sequence += 1
  }

  throw new Error(`Unable to allocate a unique id for prefix ${prefix}`)
}

export function generateStudentId(departmentSource: string | null | undefined) {
  return generateFormattedId('students', 'STU', departmentSource)
}

export function generateProfessorId(departmentSource: string | null | undefined) {
  return generateFormattedId('professors', 'PRF', departmentSource)
}
