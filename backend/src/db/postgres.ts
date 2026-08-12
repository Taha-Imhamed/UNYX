import { Pool, type PoolClient } from 'pg'
import dotenv from 'dotenv'
import { logger } from '../lib/logger.js'

dotenv.config({ path: '.env.local' })
dotenv.config()

type Primitive = string | number | boolean | null

type FilterOperatorValue = {
  $in?: unknown[]
  $nin?: unknown[]
  $ne?: unknown
  $exists?: boolean
  $size?: number
  $gt?: unknown
  $gte?: unknown
  $lt?: unknown
  $lte?: unknown
  $regex?: string
  $options?: string
}

type FilterValue = Primitive | Date | FilterOperatorValue | Array<unknown> | Record<string, unknown>

export type FilterQuery = Record<string, FilterValue> & {
  $and?: FilterQuery[]
  $or?: FilterQuery[]
}

type ProjectionSpec = Record<string, 0 | 1 | boolean>
type SortSpec = Record<string, 1 | -1>

type UpdateDocument<T> = {
  $set?: Partial<T>
  $unset?: Record<string, unknown>
}

type ColumnInfo = {
  columnName: string
  dataType: string
  udtName: string
}

type RowRecord = Record<string, unknown>

export interface QueryCursor<T> {
  sort(spec: SortSpec): QueryCursor<T>
  skip(amount: number): QueryCursor<T>
  limit(amount: number): QueryCursor<T>
  project(spec: ProjectionSpec): QueryCursor<T>
  toArray(): Promise<T[]>
  count(): Promise<number>
}

export interface CollectionLike<T extends Record<string, unknown>> {
  find<U extends Record<string, unknown> = T>(filter?: FilterQuery, options?: { projection?: ProjectionSpec }): QueryCursor<U>
  findOne<U extends Record<string, unknown> = T>(filter?: FilterQuery, options?: { projection?: ProjectionSpec }): Promise<U | null>
  createIndex(keys: Record<string, 1 | -1>, options?: { unique?: boolean }): Promise<string>
  insertOne(doc: T): Promise<{ acknowledged: true; insertedId?: string }>
  insertMany(docs: T[]): Promise<{ acknowledged: true; insertedCount: number }>
  updateOne(filter: FilterQuery, update: UpdateDocument<T>, options?: { upsert?: boolean }): Promise<{ acknowledged: true; matchedCount: number; modifiedCount: number; upsertedCount: number }>
  updateMany(filter: FilterQuery, update: UpdateDocument<T>, options?: { upsert?: boolean }): Promise<{ acknowledged: true; matchedCount: number; modifiedCount: number; upsertedCount: number }>
  deleteOne(filter: FilterQuery): Promise<{ acknowledged: true; deletedCount: number }>
  countDocuments(filter?: FilterQuery): Promise<number>
  estimatedDocumentCount(): Promise<number>
  aggregate<U extends Record<string, unknown> = Record<string, unknown>>(pipeline: Array<Record<string, unknown>>): QueryCursor<U>
}

function getDatabaseUrl() {
  return (
    process.env.SUPABASE_DB_URL?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.SUPABASE_CONNECTION_STRING?.trim() ||
    process.env.POSTGRES_CONNECTION_STRING?.trim() ||
    ''
  )
}

function getMissingDatabaseUrlError() {
  return new Error('Missing Supabase/Postgres connection string. Set DATABASE_URL or SUPABASE_DB_URL in backend/.env.local.')
}

let pool: Pool | null = null

function getPool() {
  if (pool) return pool

  const databaseUrl = getDatabaseUrl()
  if (!databaseUrl) {
    throw getMissingDatabaseUrlError()
  }

  const shouldUseSsl =
    process.env.POSTGRES_SSL === 'true' ||
    process.env.SUPABASE_SSL === 'true' ||
    /supabase\.co|sslmode=require/i.test(databaseUrl)

  pool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
  })

  return pool
}

const TABLE_ALIASES: Record<string, string> = {}

const columnCache = new Map<string, ColumnInfo[]>()

function quoteIdentifier(identifier: string) {
  return `"${identifier.replace(/"/g, '""')}"`
}

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)
}

function isNumericColumn(dataType: string) {
  return ['integer', 'smallint', 'bigint', 'numeric', 'decimal', 'real', 'double precision'].includes(dataType)
}

function isTemporalColumn(dataType: string) {
  return ['date', 'timestamp without time zone', 'timestamp with time zone', 'time without time zone', 'time with time zone'].includes(dataType)
}

function normalizeDbValue(value: unknown, column: ColumnInfo | undefined) {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value === 'string' && value.trim() === '' && column && isTemporalColumn(column.dataType)) {
    // Avoid Postgres DateTimeParseError for empty-string inputs on temporal columns.
    return null
  }
  if (value instanceof Date) return value.toISOString()
  if (column?.dataType === 'json' || column?.dataType === 'jsonb') {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!trimmed) return null
      try {
        return JSON.stringify(JSON.parse(trimmed))
      } catch {
        // Preserve legacy malformed payloads as JSON strings rather than failing the whole update.
        return JSON.stringify(trimmed)
      }
    }
    try {
      return JSON.stringify(value)
    } catch {
      return JSON.stringify(String(value))
    }
  }
  if (column?.dataType === 'ARRAY') {
    return value
  }
  if (Array.isArray(value) || isPlainObject(value)) {
    return JSON.stringify(value)
  }
  return value
}

function normalizeDocumentValue(value: unknown, column: ColumnInfo | undefined) {
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (column && isNumericColumn(column.dataType) && typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : value
  }
  return value
}

function getDeepValue(document: unknown, path: string) {
  const parts = path.split('.')
  let current: any = document
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

function compareLoose(left: unknown, right: unknown): boolean {
  if (left == null || right == null) return left === right
  if (left instanceof Date || right instanceof Date) {
    const leftTime = new Date(left as any).getTime()
    const rightTime = new Date(right as any).getTime()
    if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return String(left) === String(right)
    return leftTime === rightTime
  }
  if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      return JSON.stringify(left) === JSON.stringify(right)
    }
    return left.some((entry) => compareLoose(entry, right))
  }
  if (Array.isArray(right)) {
    return right.some((entry) => compareLoose(left, entry))
  }
  if (typeof left === 'object' || typeof right === 'object') {
    return JSON.stringify(left) === JSON.stringify(right)
  }
  return left === right
}

function matchesCondition(value: unknown, condition: unknown): boolean {
  if (isPlainObject(condition)) {
    const operatorKeys = Object.keys(condition).filter((key) => key.startsWith('$'))
    if (operatorKeys.length === 0) {
      return compareLoose(value, condition)
    }

    for (const operator of operatorKeys) {
      const operatorValue = (condition as FilterOperatorValue & Record<string, unknown>)[operator]

      switch (operator) {
        case '$in': {
          const candidates = Array.isArray(operatorValue) ? operatorValue : []
          if (Array.isArray(value)) {
            if (!value.some((entry) => candidates.some((candidate) => compareLoose(entry, candidate)))) {
              return false
            }
          } else if (!candidates.some((candidate) => compareLoose(value, candidate))) {
            return false
          }
          break
        }
        case '$nin': {
          const candidates = Array.isArray(operatorValue) ? operatorValue : []
          if (Array.isArray(value)) {
            if (value.some((entry) => candidates.some((candidate) => compareLoose(entry, candidate)))) {
              return false
            }
          } else if (candidates.some((candidate) => compareLoose(value, candidate))) {
            return false
          }
          break
        }
        case '$ne':
          if (compareLoose(value, operatorValue)) return false
          break
        case '$exists': {
          const exists = value !== undefined && value !== null
          if (Boolean(operatorValue) !== exists) return false
          break
        }
        case '$size': {
          const expectedSize = typeof operatorValue === 'number' ? operatorValue : Number(operatorValue)
          const actualSize = Array.isArray(value) ? value.length : value == null ? 0 : undefined
          if (actualSize !== expectedSize) return false
          break
        }
        case '$gt':
          if (!((value as any) > (operatorValue as any))) return false
          break
        case '$gte':
          if (!((value as any) >= (operatorValue as any))) return false
          break
        case '$lt':
          if (!((value as any) < (operatorValue as any))) return false
          break
        case '$lte':
          if (!((value as any) <= (operatorValue as any))) return false
          break
        case '$regex': {
          const flags = typeof (condition as FilterOperatorValue).$options === 'string'
            ? (condition as FilterOperatorValue).$options
            : undefined
          try {
            const regex = new RegExp(String(operatorValue), flags)
            if (typeof value !== 'string' || !regex.test(value)) return false
          } catch {
            return false
          }
          break
        }
        default:
          break
      }
    }

    const plainEntries = Object.entries(condition).filter(([key]) => !key.startsWith('$'))
    if (plainEntries.length === 0) {
      return true
    }
    return plainEntries.every(([key, nestedCondition]) => matchesCondition(getDeepValue(value, key), nestedCondition))
  }

  return compareLoose(value, condition)
}

function matchesFilter(document: unknown, filter: FilterQuery = {}) {
  const { $and, $or, ...rest } = filter

  if ($and && !$and.every((entry) => matchesFilter(document, entry))) {
    return false
  }

  if ($or && !$or.some((entry) => matchesFilter(document, entry))) {
    return false
  }

  return Object.entries(rest).every(([key, condition]) => {
    const value = getDeepValue(document, key)
    return matchesCondition(value, condition)
  })
}

function sortDocuments<T extends Record<string, unknown>>(documents: T[], sortSpec?: SortSpec) {
  if (!sortSpec) return documents
  const entries = Object.entries(sortSpec)
  return [...documents].sort((left, right) => {
    for (const [field, direction] of entries) {
      const leftValue = getDeepValue(left, field)
      const rightValue = getDeepValue(right, field)
      if (compareLoose(leftValue, rightValue)) continue

      const leftComparable = leftValue instanceof Date ? leftValue.getTime() : leftValue
      const rightComparable = rightValue instanceof Date ? rightValue.getTime() : rightValue
      if (leftComparable == null && rightComparable == null) continue
      if (leftComparable == null) return direction === 1 ? -1 : 1
      if (rightComparable == null) return direction === 1 ? 1 : -1

      if (leftComparable > rightComparable) return direction === 1 ? 1 : -1
      if (leftComparable < rightComparable) return direction === 1 ? -1 : 1
    }
    return 0
  })
}

function projectDocument<T extends Record<string, unknown>>(document: T, projection?: ProjectionSpec) {
  if (!projection || Object.keys(projection).length === 0) {
    return document
  }

  const includeKeys = Object.entries(projection).filter(([, value]) => Boolean(value)).map(([key]) => key)
  if (includeKeys.length === 0) {
    return document
  }

  const projected: Record<string, unknown> = {}
  for (const key of includeKeys) {
    const value = getDeepValue(document, key)
    if (value !== undefined) {
      projected[key] = value
    }
  }
  return projected as T
}

function applyProjection<T extends Record<string, unknown>>(documents: T[], projection?: ProjectionSpec) {
  if (!projection || Object.keys(projection).length === 0) {
    return documents
  }
  return documents.map((document) => projectDocument(document, projection))
}

async function getTableColumns(tableName: string) {
  const cached = columnCache.get(tableName)
  if (cached) {
    return cached
  }

  const { rows } = await getPool().query<ColumnInfo>(
    `select column_name as "columnName", data_type as "dataType", udt_name as "udtName"
     from information_schema.columns
     where table_schema = 'public' and table_name = $1
     order by ordinal_position`,
    [tableName],
  )

  columnCache.set(tableName, rows)
  return rows
}

async function getTableInfo(tableName: string) {
  const resolvedTable = TABLE_ALIASES[tableName] ?? tableName
  const columns = await getTableColumns(resolvedTable)
  const columnMap = new Map(columns.map((column) => [column.columnName, column]))
  return { tableName: resolvedTable, columns, columnMap }
}

function rowToDocument(row: RowRecord, columnMap: Map<string, ColumnInfo>) {
  const document: Record<string, unknown> = {}

  for (const [columnName, rawValue] of Object.entries(row)) {
    const columnInfo = columnMap.get(columnName)
    const propertyName = toCamelCase(columnName)
    const value = normalizeDocumentValue(rawValue, columnInfo)
    document[propertyName] = value instanceof Date ? value.toISOString() : value
  }

  return document
}

function toDbRecord(tableInfo: Awaited<ReturnType<typeof getTableInfo>>, document: Record<string, unknown>) {
  const record: Record<string, unknown> = {}

  for (const [propertyName, value] of Object.entries(document)) {
    const columnName = toSnakeCase(propertyName)
    const columnInfo = tableInfo.columnMap.get(columnName)
    if (!columnInfo) {
      // Silently dropping this write is how "ship UI before schema exists" is meant to work,
      // but a dropped field on a table that's otherwise fully migrated is much more likely to be
      // a missing migration than an intentional not-yet-built column. Log it loudly so that class
      // of bug (code writes a field, nobody ever added the column) surfaces immediately instead of
      // silently discarding data for months. See TASKS.md 2026-08-10 enrollments entry for the
      // incident this would have caught.
      logger.warn(
        { table: tableInfo.tableName, field: propertyName, column: columnName },
        `[db] dropping write to ${tableInfo.tableName}.${columnName} -- column does not exist (property "${propertyName}" has no matching migration)`,
      )
      continue
    }

    const normalized = normalizeDbValue(value, columnInfo)
    if (normalized !== undefined) {
      record[columnName] = normalized
    }
  }

  return record
}

function isMissingRelationError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === '42P01'
}

class ArrayCursor<T extends Record<string, unknown> = Record<string, unknown>> implements QueryCursor<T> {
  private sortSpec?: SortSpec
  private limitCount?: number
  private skipCount = 0
  private projection?: ProjectionSpec

  constructor(private readonly loader: () => Promise<T[]>) {}

  sort(spec: SortSpec) {
    this.sortSpec = { ...(this.sortSpec ?? {}), ...spec }
    return this
  }

  skip(amount: number) {
    this.skipCount = Math.max(0, amount)
    return this
  }

  limit(amount: number) {
    this.limitCount = Math.max(0, amount)
    return this
  }

  project(spec: ProjectionSpec) {
    this.projection = { ...(this.projection ?? {}), ...spec }
    return this
  }

  async toArray() {
    const loaded = await this.loader()
    const sorted = sortDocuments(loaded, this.sortSpec)
    const sliced = typeof this.limitCount === 'number' ? sorted.slice(this.skipCount, this.skipCount + this.limitCount) : sorted.slice(this.skipCount)
    return applyProjection(sliced, this.projection)
  }

  async count() {
    const loaded = await this.loader()
    return loaded.length
  }
}

class PostgresCollection<T extends Record<string, unknown>> implements CollectionLike<T> {
  constructor(private readonly collectionName: string) {}

  async createIndex(keys: Record<string, 1 | -1>, options?: { unique?: boolean }) {
    const tableInfo = await getTableInfo(this.collectionName)
    const entries = Object.entries(keys).filter(([, direction]) => direction === 1 || direction === -1)
    if (entries.length === 0) {
      throw new Error(`Invalid index definition for ${this.collectionName}`)
    }

    const normalizedParts = entries.map(([field]) => toSnakeCase(field))
    const suffix = normalizedParts.join('_')
    const indexName = `idx_${tableInfo.tableName}_${suffix}`.slice(0, 63)
    const uniqueSql = options?.unique ? 'unique ' : ''
    const columnsSql = entries
      .map(([field, direction]) => `${quoteIdentifier(toSnakeCase(field))} ${direction === -1 ? 'desc' : 'asc'}`)
      .join(', ')

    await getPool().query(
      `create ${uniqueSql}index if not exists ${quoteIdentifier(indexName)} on ${quoteIdentifier(tableInfo.tableName)} (${columnsSql})`,
    )

    return indexName
  }

  private async loadAll() {
    let tableName: string | undefined
    try {
      const tableInfo = await getTableInfo(this.collectionName)
      tableName = tableInfo.tableName
      const { rows } = await getPool().query<RowRecord>(`select * from ${quoteIdentifier(tableInfo.tableName)}`)
      return rows.map((row) => rowToDocument(row, tableInfo.columnMap)) as T[]
    } catch (error) {
      if (isMissingRelationError(error)) {
        logger.warn(
          { collection: this.collectionName, tableName, code: (error as { code?: string }).code },
          `[db] missing table for collection ${this.collectionName}; returning empty result`,
        )
        return [] as T[]
      }
      throw error
    }
  }

  private async insertDocument(document: Record<string, unknown>) {
    const tableInfo = await getTableInfo(this.collectionName)
    const record = toDbRecord(tableInfo, document)
    const columns = Object.keys(record)
    if (columns.length === 0) {
      throw new Error(`Cannot insert empty document into ${this.collectionName}`)
    }

    const values = columns.map((column) => record[column])
    const placeholders = columns.map((_, index) => `$${index + 1}`)
    const columnList = columns.map((column) => quoteIdentifier(column)).join(', ')
    const { rows } = await getPool().query<RowRecord>(
      `insert into ${quoteIdentifier(tableInfo.tableName)} (${columnList}) values (${placeholders.join(', ')}) returning *`,
      values,
    )

    return rowToDocument(rows[0], tableInfo.columnMap) as T
  }

  private async updateById(id: string, document: Record<string, unknown>) {
    const tableInfo = await getTableInfo(this.collectionName)
    const record = toDbRecord(tableInfo, document)
    const columns = Object.keys(record).filter((column) => column !== 'id')
    if (columns.length === 0) {
      return
    }

    const values = columns.map((column) => record[column])
    values.push(id)
    const assignments = columns.map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`)

    await getPool().query(
      `update ${quoteIdentifier(tableInfo.tableName)} set ${assignments.join(', ')} where ${quoteIdentifier('id')} = $${columns.length + 1}`,
      values,
    )
  }

  private async applyUpdate(filter: FilterQuery, update: UpdateDocument<T>, upsert = false) {
    const documents = await this.loadAll()
    const matched = documents.filter((document) => matchesFilter(document, filter))
    const setValues = (update.$set ?? {}) as Record<string, unknown>
    const unsetValues = update.$unset ?? {}

    if (matched.length === 0) {
      if (!upsert) {
        return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 }
      }

      const seedDocument = {
        ...(isPlainObject(filter) ? filter : {}),
        ...setValues,
      }
      await this.insertDocument(seedDocument)
      return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }
    }

    let modifiedCount = 0
    for (const document of matched) {
      const nextDocument: Record<string, unknown> = { ...document, ...setValues }
      for (const key of Object.keys(unsetValues)) {
        delete nextDocument[key]
      }
      await this.updateById(String((document as Record<string, unknown>).id), nextDocument)
      modifiedCount += 1
    }

    return { matchedCount: matched.length, modifiedCount, upsertedCount: 0 }
  }

  find<U extends Record<string, unknown> = T>(filter: FilterQuery = {}, options?: { projection?: ProjectionSpec }) {
    return new ArrayCursor<U>(async () => {
      const documents = await this.loadAll()
      const matched = documents.filter((document) => matchesFilter(document, filter))
      return (options?.projection ? applyProjection(matched, options.projection) : matched) as unknown as U[]
    })
  }

  async findOne<U extends Record<string, unknown> = T>(filter: FilterQuery = {}, options?: { projection?: ProjectionSpec }): Promise<U | null> {
    const documents = await this.find<U>(filter, options).limit(1).toArray()
    return documents[0] ?? null
  }

  async insertOne(doc: T) {
    const inserted = await this.insertDocument(doc as Record<string, unknown>)
    return { acknowledged: true as const, insertedId: (inserted as Record<string, unknown>).id as string | undefined }
  }

  async insertMany(docs: T[]) {
    for (const doc of docs) {
      await this.insertDocument(doc as Record<string, unknown>)
    }
    return { acknowledged: true as const, insertedCount: docs.length }
  }

  async updateOne(filter: FilterQuery, update: UpdateDocument<T>, options?: { upsert?: boolean }) {
    const result = await this.applyUpdate(filter, update, options?.upsert)
    return { acknowledged: true as const, ...result }
  }

  async updateMany(filter: FilterQuery, update: UpdateDocument<T>, options?: { upsert?: boolean }) {
    const result = await this.applyUpdate(filter, update, options?.upsert)
    return { acknowledged: true as const, ...result }
  }

  async deleteOne(filter: FilterQuery) {
    const documents = await this.find(filter).limit(1).toArray()
    const target = documents[0]
    if (!target) {
      return { acknowledged: true as const, deletedCount: 0 }
    }

    const tableInfo = await getTableInfo(this.collectionName)
    await getPool().query(`delete from ${quoteIdentifier(tableInfo.tableName)} where ${quoteIdentifier('id')} = $1`, [String((target as Record<string, unknown>).id)])
    return { acknowledged: true as const, deletedCount: 1 }
  }

  async countDocuments(filter: FilterQuery = {}) {
    return (await this.find(filter).toArray()).length
  }

  async estimatedDocumentCount() {
    return (await this.loadAll()).length
  }

  aggregate<U extends Record<string, unknown> = Record<string, unknown>>(pipeline: Array<Record<string, unknown>>) {
    return new ArrayCursor<U>(async () => {
      let documents: Record<string, unknown>[] = await this.loadAll()

      for (const stage of pipeline) {
        if ('$match' in stage) {
          documents = documents.filter((document) => matchesFilter(document, stage.$match as FilterQuery))
          continue
        }

        if ('$group' in stage) {
          const groupSpec = stage.$group as Record<string, unknown>
          const grouped = new Map<string, Record<string, unknown>>()

          for (const document of documents) {
            const groupIdExpression = groupSpec._id
            const groupKey = typeof groupIdExpression === 'string' && groupIdExpression.startsWith('$')
              ? String(getDeepValue(document, groupIdExpression.slice(1)) ?? '')
              : String(groupIdExpression ?? '')

            if (!grouped.has(groupKey)) {
              grouped.set(groupKey, { _id: groupKey })
            }

            const bucket = grouped.get(groupKey) as Record<string, unknown>

            for (const [key, value] of Object.entries(groupSpec)) {
              if (key === '_id') continue

              if (isPlainObject(value) && '$sum' in value) {
                const sumOperand = (value as Record<string, unknown>).$sum
                const resolved = typeof sumOperand === 'string' && sumOperand.startsWith('$')
                  ? getDeepValue(document, sumOperand.slice(1))
                  : sumOperand
                const nextValue = Number(resolved ?? 0)
                bucket[key] = Number(bucket[key] ?? 0) + (Number.isFinite(nextValue) ? nextValue : 0)
                continue
              }

              if (isPlainObject(value) && '$addToSet' in value) {
                const setOperand = (value as Record<string, unknown>).$addToSet
                const resolved = typeof setOperand === 'string' && setOperand.startsWith('$')
                  ? getDeepValue(document, setOperand.slice(1))
                  : setOperand
                const existingSet = Array.isArray(bucket[key]) ? (bucket[key] as unknown[]) : []
                if (!existingSet.some((entry) => compareLoose(entry, resolved))) {
                  bucket[key] = [...existingSet, resolved]
                }
              }
            }
          }

          documents = Array.from(grouped.values())
          continue
        }

        if ('$project' in stage) {
          const projectSpec = stage.$project as Record<string, unknown>
          documents = documents.map((document) => {
            const nextDocument: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(projectSpec)) {
              if (!value) continue

              if (isPlainObject(value) && '$size' in value) {
                const sizeOperand = (value as Record<string, unknown>).$size
                const resolved = typeof sizeOperand === 'string' && sizeOperand.startsWith('$')
                  ? getDeepValue(document, sizeOperand.slice(1))
                  : sizeOperand
                nextDocument[key] = Array.isArray(resolved) ? resolved.length : 0
                continue
              }

              const sourceValue = typeof value === 'string' && value.startsWith('$')
                ? getDeepValue(document, value.slice(1))
                : (document as Record<string, unknown>)[key]
              nextDocument[key] = sourceValue
            }
            return nextDocument
          })
          continue
        }

        if ('$sort' in stage) {
          documents = sortDocuments(documents as T[], stage.$sort as SortSpec) as Record<string, unknown>[]
          continue
        }

        if ('$limit' in stage) {
          const limitAmount = Number(stage.$limit)
          documents = documents.slice(0, Number.isFinite(limitAmount) ? limitAmount : documents.length)
        }
      }

      return documents as U[]
    })
  }
}

export async function ensureDatabaseConnection() {
  await getPool().query('select 1')
}

export async function runDbQuery<T extends RowRecord = RowRecord>(text: string, params?: unknown[]) {
  return getPool().query<T>(text, params)
}

export async function withDbClient<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect()
  try {
    return await callback(client)
  } finally {
    client.release()
  }
}

export async function runInTransaction<T>(callback: (client: PoolClient) => Promise<T>) {
  return withDbClient(async (client) => {
    await client.query('begin')
    try {
      const result = await callback(client)
      await client.query('commit')
      return result
    } catch (error) {
      await client.query('rollback')
      throw error
    }
  })
}

export function invalidateTableCache(tableName?: string) {
  if (!tableName) {
    columnCache.clear()
    return
  }
  columnCache.delete(TABLE_ALIASES[tableName] ?? tableName)
}

export async function getCollection<T extends Record<string, unknown>>(name: string): Promise<CollectionLike<T>> {
  return new PostgresCollection<T>(name)
}

export async function disconnectDb() {
  if (!pool) return
  await pool.end()
  pool = null
}

export function getActiveDbInfo() {
  const databaseUrl = getDatabaseUrl()
  let dbName = 'unknown'
  try {
    const parsed = new URL(databaseUrl)
    dbName = parsed.pathname.replace(/^\//, '') || 'postgres'
  } catch {
    dbName = databaseUrl ? 'postgres' : 'not-configured'
  }

  return {
    connectionUrl: databaseUrl || 'not-configured',
    dbName,
  }
}
