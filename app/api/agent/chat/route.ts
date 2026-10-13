import { NextRequest, NextResponse } from 'next/server'

import {
  extractUpstreamError,
  normalizeBaseUrl,
  resolveAgentModelConfig,
  toUpstreamFetchError,
} from '../_shared'

import type { AgentChatMessage, AgentToolDefinition } from '@/types/agent'

// 代理 OpenAI 兼容的流式对话请求：客户端 → 本接口 → 上游大模型
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const modelConfig = await resolveAgentModelConfig(body.configId)

    if (!modelConfig) {
      return NextResponse.json({ error: '请先在「配置」中添加模型配置' }, { status: 400 })
    }

    const messages: AgentChatMessage[] = Array.isArray(body.messages) ? body.messages : []
    if (messages.length === 0) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    const tools: AgentToolDefinition[] = Array.isArray(body.tools) ? body.tools : []
    const systemPrompt = modelConfig.systemPrompt?.trim()

    const upstreamBody = {
      model: modelConfig.model,
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
      stream: true,
      ...(tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    }

    const response = await fetch(`${normalizeBaseUrl(modelConfig.baseUrl)}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(modelConfig.apiKey ? { Authorization: `Bearer ${modelConfig.apiKey}` } : {}),
      },
      body: JSON.stringify(upstreamBody),
      signal: req.signal,
      cache: 'no-store',
    })

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => '')
      return NextResponse.json(
        { error: `上游接口错误 (${response.status})：${extractUpstreamError(text)}` },
        { status: 502 },
      )
    }

    // 原样透传 SSE 流
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    // 客户端主动中断（停止生成 / 关闭页面）时静默结束
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }

    console.error('Agent chat failed:', error)
    return NextResponse.json(
      { error: `对话请求失败：${toUpstreamFetchError(error)}` },
      { status: 500 },
    )
  }
}
