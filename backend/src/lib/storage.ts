import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { logger } from './logger.js'

export interface StorageBackend {
  /** Stores the file and returns a URL/path the frontend can fetch it from. */
  save(key: string, data: Buffer, contentType: string): Promise<string>
  delete(key: string): Promise<void>
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../uploads')

class LocalDiskStorage implements StorageBackend {
  async save(key: string, data: Buffer): Promise<string> {
    await mkdir(UPLOADS_DIR, { recursive: true })
    await writeFile(join(UPLOADS_DIR, key), data)
    return `/uploads/${key}`
  }

  async delete(key: string): Promise<void> {
    try {
      await rm(join(UPLOADS_DIR, key))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  async read(key: string): Promise<Buffer> {
    return readFile(join(UPLOADS_DIR, key))
  }
}

class S3Storage implements StorageBackend {
  private clientPromise: Promise<import('@aws-sdk/client-s3').S3Client> | null = null
  private bucket: string

  constructor(bucket: string) {
    this.bucket = bucket
  }

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = import('@aws-sdk/client-s3').then(
        ({ S3Client }) =>
          new S3Client({
            region: process.env.S3_REGION || 'us-east-1',
            endpoint: process.env.S3_ENDPOINT || undefined,
            credentials:
              process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
                ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY }
                : undefined,
          }),
      )
    }
    return this.clientPromise
  }

  async save(key: string, data: Buffer, contentType: string): Promise<string> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    await client.send(new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType }))
    const endpoint = process.env.S3_ENDPOINT
    return endpoint ? `${endpoint}/${this.bucket}/${key}` : `https://${this.bucket}.s3.amazonaws.com/${key}`
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    const client = await this.getClient()
    await client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }
}

let backend: StorageBackend | undefined

function getBackend(): StorageBackend {
  if (backend) return backend

  const driver = process.env.STORAGE_DRIVER || 'local'
  if (driver === 's3') {
    const bucket = process.env.S3_BUCKET
    if (!bucket) {
      logger.warn('[storage] STORAGE_DRIVER=s3 set but S3_BUCKET missing — falling back to local disk')
      backend = new LocalDiskStorage()
    } else {
      backend = new S3Storage(bucket)
    }
  } else {
    backend = new LocalDiskStorage()
  }
  return backend
}

/** Extracts the mime type and raw bytes from a `data:<mime>;base64,<data>` URL. */
export function decodeDataUrl(dataUrl: string): { contentType: string; buffer: Buffer } | null {
  const match = dataUrl.match(/^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/)
  if (!match) return null
  const [, contentType, base64Data] = match
  return { contentType, buffer: Buffer.from(base64Data, 'base64') }
}

function extensionForMimeType(mimeType: string): string {
  const subtype = mimeType.split('/')[1] || 'bin'
  return subtype.replace('vnd.openxmlformats-officedocument.', '').split('.').pop() || 'bin'
}

/**
 * Saves a base64 data URL to the configured storage backend (local disk by
 * default; S3 if STORAGE_DRIVER=s3 and S3_BUCKET are set) and returns the
 * resulting public URL, replacing the need to store the file inline as base64.
 */
export async function saveDataUrl(dataUrl: string, filenameHint?: string): Promise<{ url: string; contentType: string; size: number } | null> {
  const decoded = decodeDataUrl(dataUrl)
  if (!decoded) return null
  const ext = filenameHint?.includes('.') ? filenameHint.split('.').pop() : extensionForMimeType(decoded.contentType)
  const key = `${randomUUID()}.${ext}`
  const url = await getBackend().save(key, decoded.buffer, decoded.contentType)
  return { url, contentType: decoded.contentType, size: decoded.buffer.byteLength }
}

export async function deleteStoredFile(key: string): Promise<void> {
  await getBackend().delete(key)
}

export { UPLOADS_DIR }
