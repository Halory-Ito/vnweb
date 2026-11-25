import { NextRequest, NextResponse } from 'next/server'

import { isPreviewProxyAllowedUrl } from '@/lib/game-image-preview'

type CachedPreviewImage = {
  data: Uint8Array
  contentType: string
  expiresAt: number
  byteLength: number
}

type PreviewCacheStore = {
  entries: Map<string, CachedPreviewImage>
  totalBytes: number
}

const MAX_ENTRIES = 64
const MAX_TOTAL_BYTES = 64 * 1024 * 1024
const MAX_IMAGE_BYTES = 15 * 1024 * 1024
const CACHE_TTL_MS = 30 * 60 * 1000
const REQUEST_TIMEOUT_MS = 10_000
const PREVIEW_USER_AGENT = 'VNWeb/1.0 (+https://github.com/Halory-Ito/vnweb)'

const cacheGlobal = globalThis as typeof globalThis & {
  gameImagePreviewCache?: PreviewCacheStore
}

function getCacheStore(): PreviewCacheStore {
  if (!cacheGlobal.gameImagePreviewCache) {
    cacheGlobal.gameImagePreviewCache = {
      entries: new Map<string, CachedPreviewImage>(),
      totalBytes: 0,
    }
  }
  return cacheGlobal.gameImagePreviewCache
}

function getCachedPreviewImage(url: string): CachedPreviewImage | null {
  const store = getCacheStore()
  const existing = store.entries.get(url)
  if (!existing) return null

  if (existing.expiresAt <= Date.now()) {
    store.entries.delete(url)
    store.totalBytes = Math.max(0, store.totalBytes - existing.byteLength)
    return null
  }

  // 刷新 LRU 顺序
  store.entries.delete(url)
  store.entries.set(url, existing)
  return existing
}

function setCachedPreviewImage(url: string, entry: CachedPreviewImage): void {
  const store = getCacheStore()
  const previous = store.entries.get(url)
  if (previous) {
    store.entries.delete(url)
    store.totalBytes = Math.max(0, store.totalBytes - previous.byteLength)
  }

  while (
    store.entries.size >= MAX_ENTRIES ||
    (store.entries.size > 0 && store.totalBytes + entry.byteLength > MAX_TOTAL_BYTES)
  ) {
    const oldestKey = store.entries.keys().next().value
    if (!oldestKey) break
    const oldest = store.entries.get(oldestKey)
    store.entries.delete(oldestKey)
    if (oldest) {
      store.totalBytes = Math.max(0, store.totalBytes - oldest.byteLength)
    }
  }

  store.entries.set(url, entry)
  store.totalBytes += entry.byteLength
}

function createImageResponse(data: Uint8Array, contentType: string): NextResponse {
  return new NextResponse(new Uint8Array(data), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=1800',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function GET(request: NextRequest) {
  const rawUrl = (request.nextUrl.searchParams.get('url') ?? '').trim()
  if (!isPreviewProxyAllowedUrl(rawUrl)) {
    return NextResponse.json({ error: '无效或不受信的图片预览地址' }, { status: 400 })
  }

  const cached = getCachedPreviewImage(rawUrl)
  if (cached) {
    return createImageResponse(cached.data, cached.contentType)
  }

  try {
    const response = await fetch(rawUrl, {
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        'User-Agent': PREVIEW_USER_AGENT,
        Accept: 'image/*',
      },
    })

    if (!response.ok) {
      const status = response.status >= 400 && response.status < 600 ? response.status : 502
      return NextResponse.json({ error: '读取远程预览图片失败' }, { status })
    }

    const contentType = (response.headers.get('content-type') ?? '')
      .split(';')[0]
      .trim()
      .toLowerCase()
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: '上游返回的不是有效图片资源' }, { status: 415 })
    }

    const declaredLength = Number(response.headers.get('content-length') ?? 0)
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: '预览图片体积超出限制' }, { status: 413 })
    }

    const buffer = await response.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    if (bytes.byteLength === 0) {
      return NextResponse.json({ error: '上游返回空图片内容' }, { status: 502 })
    }
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: '预览图片体积超出限制' }, { status: 413 })
    }

    setCachedPreviewImage(rawUrl, {
      data: bytes,
      contentType,
      expiresAt: Date.now() + CACHE_TTL_MS,
      byteLength: bytes.byteLength,
    })

    return createImageResponse(bytes, contentType)
  } catch {
    return NextResponse.json({ error: '获取预览图片超时或失败' }, { status: 502 })
  }
}
