import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

import type { GoalSettings } from '@/types'

export const DEFAULT_GOALS: GoalSettings = {
  dailyPlayMinutes: 60,
  yearlyCompletedGames: 12,
}

const toPositiveInt = (value: unknown, fallback: number) => {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) {
    return fallback
  }
  return Math.round(n)
}

// 读取目标设置
async function readGoals(): Promise<GoalSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const goals = (settings['goals'] || {}) as Record<string, unknown>

  return {
    dailyPlayMinutes: toPositiveInt(goals['dailyPlayMinutes'], DEFAULT_GOALS.dailyPlayMinutes),
    yearlyCompletedGames: toPositiveInt(
      goals['yearlyCompletedGames'],
      DEFAULT_GOALS.yearlyCompletedGames,
    ),
  }
}

// 获取目标设置
export async function GET(_req: NextRequest) {
  try {
    const goals = await readGoals()
    return NextResponse.json({ data: goals })
  } catch (error) {
    console.error('Get goal settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取目标设置失败' },
      { status: 500 },
    )
  }
}

// 更新目标设置
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<GoalSettings>
    const current = await readGoals()

    const next: GoalSettings = {
      dailyPlayMinutes: toPositiveInt(body.dailyPlayMinutes, current.dailyPlayMinutes),
      yearlyCompletedGames: toPositiveInt(body.yearlyCompletedGames, current.yearlyCompletedGames),
    }

    // 只更新 settings.goals，不影响其他属性
    await updateConfigSection(['settings', 'goals'], next)

    return NextResponse.json({ data: next })
  } catch (error) {
    console.error('Update goal settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新目标设置失败' },
      { status: 500 },
    )
  }
}
