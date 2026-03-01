import { NextRequest, NextResponse } from 'next/server'

import extractIconFromExe from '@/win/extract-icon'

type ExtractIconRequest = {
  exePath?: string
  iconSavePath?: string
  timeoutMs?: number
}

export const POST = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as ExtractIconRequest
    const exePath = body?.exePath
    const iconSavePath = body?.iconSavePath
    const timeoutMs = body?.timeoutMs

    if (!exePath || !iconSavePath) {
      return NextResponse.json(
        { error: 'exePath 和 iconSavePath 为必填项' },
        { status: 400 },
      )
    }

    const extractedPath = await extractIconFromExe(
      exePath,
      iconSavePath,
      timeoutMs,
    )

    return NextResponse.json({ data: { iconPath: extractedPath } })
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message || '图标提取失败' },
      { status: 500 },
    )
  }
}
