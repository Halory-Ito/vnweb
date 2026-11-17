import { NextRequest, NextResponse } from 'next/server'

import { getOstAlbum } from '@/lib/server/ost-albums'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^\d{1,16}$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0)
    return NextResponse.json({ error: '无效的专辑 ID' }, { status: 400 })
  try {
    return NextResponse.json({ data: await getOstAlbum(id) })
  } catch {
    return NextResponse.json(
      { error: '无法读取完整专辑，请检查专辑 ID 或稍后重试' },
      { status: 502 },
    )
  }
}
