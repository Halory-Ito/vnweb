import { NextRequest, NextResponse } from 'next/server'

import { pickWindowsFile } from '@/lib/server/windows-file-dialog'

type SelectFilePayload = {
  filter?: string
  title?: string
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json().catch(() => ({}))) as SelectFilePayload
    const filePath = await pickWindowsFile({
      filter: payload.filter,
      title: payload.title,
    })

    if (!filePath) {
      return NextResponse.json({ error: '未选择文件' }, { status: 400 })
    }

    return NextResponse.json({ data: { filePath } })
  } catch (error) {
    console.error('Select file failed:', error)
    return NextResponse.json({ error: '选择文件失败' }, { status: 500 })
  }
}
