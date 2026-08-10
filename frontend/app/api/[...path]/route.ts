import { NextRequest, NextResponse } from 'next/server'

const RAW_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

function resolveBackendBase() {
  const trimmed = RAW_BACKEND_URL.trim().replace(/\/+$/, '')
  // Accept either https://host or https://host/api from env and normalize to host base.
  return trimmed.endsWith('/api') ? trimmed.slice(0, -4) : trimmed
}

const BACKEND_BASE = resolveBackendBase()

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api/', '')
  const searchParams = request.nextUrl.search
  const url = `${BACKEND_BASE}/api/${path}${searchParams}`

  const headers = new Headers()
  const contentType = request.headers.get('content-type')
  const auth = request.headers.get('authorization')
  if (contentType) headers.set('Content-Type', contentType)
  if (auth) headers.set('Authorization', auth)

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method !== 'GET' ? await request.text() : undefined,
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    console.error('[api-proxy] Error proxying request to backend:', error)
    return NextResponse.json(
      { success: false, error: 'Backend service unavailable' },
      { status: 503 }
    )
  }
}

export async function GET(request: NextRequest) {
  return middleware(request)
}

export async function POST(request: NextRequest) {
  return middleware(request)
}

export async function PUT(request: NextRequest) {
  return middleware(request)
}

export async function DELETE(request: NextRequest) {
  return middleware(request)
}

export async function PATCH(request: NextRequest) {
  return middleware(request)
}
