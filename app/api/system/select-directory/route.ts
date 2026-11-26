import { NextRequest, NextResponse } from 'next/server'

import { pickWindowsDirectory } from '@/lib/server/windows-file-dialog'

type SelectDirectoryPayload = {
  title?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as SelectDirectoryPayload
    const directory = await pickWindowsDirectory(payload.title)

    if (!directory) {
      return NextResponse.json({ error: '未选择目录' }, { status: 400 })
    }

    return NextResponse.json({ data: { directory } })
  } catch (error) {
    console.error('Select directory failed:', error)
    return NextResponse.json({ error: '选择目录失败' }, { status: 500 })
  }
}
