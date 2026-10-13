import { NextRequest, NextResponse } from 'next/server'

import {
  extractUpstreamError,
  normalizeBaseUrl,
  resolveAgentApiKey,
  toUpstreamFetchError,
} from '../_shared'

const MODELS_REQUEST_TIMEOUT_MS = 20_000

// 拉取 OpenAI 兼容接口的模型列表（用于「测试连接」与模型选择）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const baseUrl = normalizeBaseUrl(body.baseUrl)

    if (!baseUrl) {
      return NextResponse.json({ error: '请填写接口地址' }, { status: 400 })
    }

    const apiKey = await resolveAgentApiKey(body.apiKey, body.configId)

    const response = await fetch(`${baseUrl}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      signal: AbortSignal.timeout(MODELS_REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    })

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `请求失败 (${response.status})：${extractUpstreamError(text)}` },
        { status: 502 },
      )
    }

    const payload = (await response.json().catch(() => null)) as {
      data?: Array<{ id?: unknown }>
    } | null

    const models = Array.isArray(payload?.data)
      ? payload.data
          .map((item) => (typeof item?.id === 'string' ? item.id : ''))
          .filter((id) => id.length > 0)
      : []

    return NextResponse.json({ data: { models } })
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({ error: '连接超时，请检查接口地址与网络' }, { status: 504 })
    }

    console.error('Fetch agent models failed:', error)
    return NextResponse.json({ error: `连接失败：${toUpstreamFetchError(error)}` }, { status: 502 })
  }
}
