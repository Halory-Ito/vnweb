import { NextRequest, NextResponse } from 'next/server'

import {
  maskAgentConfig,
  mergeAgentApiKeys,
  normalizeAgentConfig,
  readAgentConfig,
  writeAgentConfig,
} from '@/lib/server/agent-config'

// 读取 Agent 模型配置（API Key 已脱敏）
export async function GET() {
  try {
    const config = await readAgentConfig()
    return NextResponse.json({ data: maskAgentConfig(config) })
  } catch (error) {
    console.error('Get agent config failed:', error)
    return NextResponse.json({ error: '读取 Agent 配置失败' }, { status: 500 })
  }
}

// 保存 Agent 模型配置（API Key 为脱敏占位符时沿用已保存的值）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const stored = await readAgentConfig()
    const merged = mergeAgentApiKeys(normalizeAgentConfig(body), stored)

    await writeAgentConfig(merged)
    return NextResponse.json({ data: maskAgentConfig(merged) })
  } catch (error) {
    console.error('Save agent config failed:', error)
    return NextResponse.json({ error: '保存 Agent 配置失败' }, { status: 500 })
  }
}
