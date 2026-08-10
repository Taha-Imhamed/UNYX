import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { randomUUID, randomBytes } from 'node:crypto'
import { getCollection } from '../src/db/postgres.js'
import { professorsCollection } from '../src/data/collections.js'
import type { Permission, Professor } from '../../../shared/types/index.js'

function generateTempPassword() {
  // 16 random bytes -> base64url, trimmed to a readable 20-char password
  return randomBytes(16).toString('base64url').slice(0, 20)
}

type StoredUserDocument = {
  id: string;
  username: string;
  normalizedUsername: string;
  email: string;
  role: 'admin' | 'supervisor' | 'user' | 'student' | 'professor' | 'advisor';
  createdAt: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  avatarUrl?: string | null;
  password: string;
  permissions?: Partial<Record<Permission, boolean>>;
  studentId?: string | null;
  professorId?: string | null;
};

function baseUsername(prof: Professor) {
  if (prof.email && prof.email.includes('@')) {
    return prof.email.split('@')[0]?.toLowerCase() || prof.id.toLowerCase()
  }
  const first = prof.firstName?.trim().toLowerCase() ?? 'prof'
  const last = prof.lastName?.trim().toLowerCase() ?? ''
  return [first, last || prof.id.toLowerCase()].filter(Boolean).join('.')
}

async function main() {
  const usersCollection = await getCollection<StoredUserDocument>('users')
  const existingUsers = await usersCollection.find().toArray()
  const existingNormalized = new Set(existingUsers.map((u) => u.normalizedUsername))
  const existingByProfessor = new Map<string, StoredUserDocument>()
  existingUsers.forEach((u) => {
    if (u.professorId) existingByProfessor.set(u.professorId, u)
  })

  const professorsCol = await professorsCollection()
  const professors = await professorsCol.find().toArray()

  const toInsert: StoredUserDocument[] = []
  const issuedCredentials: Array<{ professor: string; username: string; password: string }> = []
  const now = new Date().toISOString()

  for (const prof of professors) {
    if (existingByProfessor.has(prof.id)) continue

    let username = baseUsername(prof)
    let candidate = username
    let counter = 1
    while (existingNormalized.has(candidate)) {
      candidate = `${username}${counter}`
      counter += 1
    }
    username = candidate

    const passwordSource = generateTempPassword()
    const passwordHash = await bcrypt.hash(passwordSource, 10)
    issuedCredentials.push({ professor: `${prof.firstName} ${prof.lastName}`.trim(), username, password: passwordSource })

    const newUser: StoredUserDocument = {
      id: `USR-${randomUUID().slice(0, 8).toUpperCase()}`,
      username,
      normalizedUsername: username.toLowerCase(),
      email: prof.email?.trim() || `${username}@example.edu`,
      role: 'professor',
      createdAt: now,
      lastLogin: now,
      status: 'active',
      avatarUrl: prof.photo?.trim() || null,
      password: passwordHash,
      permissions: {},
      studentId: null,
      professorId: prof.id,
    }

    toInsert.push(newUser)
    existingNormalized.add(newUser.normalizedUsername)
  }

  if (toInsert.length > 0) {
    await usersCollection.insertMany(toInsert)
    console.log(`Created ${toInsert.length} professor user accounts.`)
    console.log('Temporary passwords (share securely with each professor, then have them change it on first login):')
    issuedCredentials.forEach(({ professor, username, password }) => {
      console.log(`  ${professor} — username: ${username}  password: ${password}`)
    })
  } else {
    console.log('All professors already have user accounts.')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to ensure professor accounts', err)
    process.exit(1)
  })
