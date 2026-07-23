import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'

import { readConfig, updateConfigSection } from '@/lib/server/config-rw'

type BackgroundTransitionStyle =
  | 'none'
  | 'center-fade'
  | 'cross-fade'
  | 'slide-up'
  | 'zoom-fade'

type BackgroundSettings = {
  custom: {
    active: boolean
    path: {
      pc: string
      mobile: string
    }
  }
  transitionStyle: BackgroundTransitionStyle
  transitionDurationMs: number
}

const DEFAULT_BACKGROUND_SETTINGS: BackgroundSettings = {
  custom: {
    active: false,
    path: {
      pc: '',
      mobile: '',
    },
  },
  transitionStyle: 'center-fade',
  transitionDurationMs: 420,
}

const VALID_TRANSITION_STYLES: BackgroundTransitionStyle[] = [
  'none',
  'center-fade',
  'cross-fade',
  'slide-up',
  'zoom-fade',
]

// 读取背景设置
async function readBackgroundSettings(): Promise<BackgroundSettings> {
  const fullConfig = await readConfig()
  const settings = (fullConfig['settings'] || {}) as Record<string, unknown>
  const appearance = (settings['appearance'] || {}) as Record<string, unknown>
  const background = (appearance['background'] || {}) as Record<string, unknown>
  const custom = (background['custom'] || {}) as Record<string, unknown>
  const p = (custom['path'] || {}) as Record<string, unknown>

  const transitionStyle = background['transitionStyle'] as string
  const transitionDurationMs = Number(background['transitionDurationMs'])

  return {
    custom: {
      active:
        typeof custom['active'] === 'boolean'
          ? custom['active']
          : DEFAULT_BACKGROUND_SETTINGS.custom.active,
      path: {
        pc:
          typeof p['pc'] === 'string'
            ? p['pc']
            : DEFAULT_BACKGROUND_SETTINGS.custom.path.pc,
        mobile:
          typeof p['mobile'] === 'string'
            ? p['mobile']
            : DEFAULT_BACKGROUND_SETTINGS.custom.path.mobile,
      },
    },
    transitionStyle: VALID_TRANSITION_STYLES.includes(
      transitionStyle as BackgroundTransitionStyle,
    )
      ? (transitionStyle as BackgroundTransitionStyle)
      : DEFAULT_BACKGROUND_SETTINGS.transitionStyle,
    transitionDurationMs:
      Number.isFinite(transitionDurationMs) && transitionDurationMs >= 0
        ? Math.min(3000, Math.max(0, Math.round(transitionDurationMs)))
        : DEFAULT_BACKGROUND_SETTINGS.transitionDurationMs,
  }
}

// 获取背景设置
export async function GET(_req: NextRequest) {
  try {
    const settings = await readBackgroundSettings()
    return NextResponse.json({ data: settings })
  } catch (error) {
    console.error('Get background settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取背景设置失败' },
      { status: 500 },
    )
  }
}

// 更新背景设置
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { custom, transitionStyle, transitionDurationMs } =
      body as Partial<BackgroundSettings>

    const current = await readBackgroundSettings()

    if (custom && typeof custom === 'object') {
      if (typeof custom.active === 'boolean') {
        current.custom.active = custom.active
      }
      if (custom.path && typeof custom.path === 'object') {
        if (typeof custom.path.pc === 'string') {
          current.custom.path.pc = custom.path.pc
        }
        if (typeof custom.path.mobile === 'string') {
          current.custom.path.mobile = custom.path.mobile
        }
      }
    }

    if (
      typeof transitionStyle === 'string' &&
      VALID_TRANSITION_STYLES.includes(
        transitionStyle as BackgroundTransitionStyle,
      )
    ) {
      current.transitionStyle = transitionStyle as BackgroundTransitionStyle
    }

    if (
      typeof transitionDurationMs === 'number' &&
      Number.isFinite(transitionDurationMs)
    ) {
      current.transitionDurationMs = Math.min(
        3000,
        Math.max(0, Math.round(transitionDurationMs)),
      )
    }

    // 只更新 settings.appearance.background，不影响其他属性
    await updateConfigSection(['settings', 'appearance', 'background'], {
      custom: current.custom,
      transitionStyle: current.transitionStyle,
      transitionDurationMs: current.transitionDurationMs,
    })

    return NextResponse.json({ data: current })
  } catch (error) {
    console.error('Update background settings failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '更新背景设置失败' },
      { status: 500 },
    )
  }
}
