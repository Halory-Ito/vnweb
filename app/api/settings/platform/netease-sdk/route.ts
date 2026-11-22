import { NextResponse } from 'next/server'

import {
  getNeteaseSdkStatus,
  installNeteaseSdk,
  startNeteaseSdk,
  stopNeteaseSdk,
  uninstallNeteaseSdk,
} from '@/lib/server/netease-sdk-manager'

export async function GET() {
  try {
    return NextResponse.json({ data: getNeteaseSdkStatus() })
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取 SDK 状态失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      action?: unknown
      port?: unknown
    }

    const action = payload.action
    const port = typeof payload.port === 'number' ? payload.port : undefined

    if (action === 'install') {
      const data = await installNeteaseSdk()
      return NextResponse.json({ data })
    }

    if (action === 'start') {
      const data = await startNeteaseSdk(port)
      return NextResponse.json({ data })
    }

    if (action === 'stop') {
      const data = await stopNeteaseSdk()
      return NextResponse.json({ data })
    }

    if (action === 'uninstall') {
      const data = await uninstallNeteaseSdk()
      return NextResponse.json({ data })
    }

    return NextResponse.json({ error: '不支持的操作类型' }, { status: 400 })
  } catch (error) {
    const message = error instanceof Error ? error.message : '操作失败'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
