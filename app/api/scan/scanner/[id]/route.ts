import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { ScannerTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { GAME_PROVIDER_OPTIONS } from '@/lib/provider-options'

type UpdateScannerPayload = {
  directory?: string
  provider?: string
  scanMode?: number
  scanLevel?: number
}

const providerSet = new Set(GAME_PROVIDER_OPTIONS.map((item) => item.value))

const updateScanner = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const scannerId = Number(id)

    if (!Number.isInteger(scannerId) || scannerId <= 0) {
      return NextResponse.json({ error: 'Invalid scanner id' }, { status: 400 })
    }

    const payload = (await req.json().catch(() => ({}))) as UpdateScannerPayload
    const directory = (payload.directory || '').trim()
    const provider = (payload.provider || '').trim()
    const scanMode = Number(payload.scanMode)
    const scanLevel = Number(payload.scanLevel ?? 0)

    if (!directory) {
      return NextResponse.json({ error: '扫描目录不能为空' }, { status: 400 })
    }

    if (!providerSet.has(provider)) {
      return NextResponse.json({ error: '数据源不合法' }, { status: 400 })
    }

    if (!Number.isInteger(scanMode) || (scanMode !== 0 && scanMode !== 1)) {
      return NextResponse.json({ error: '扫描模式不合法' }, { status: 400 })
    }

    if (!Number.isInteger(scanLevel) || scanLevel < 0) {
      return NextResponse.json({ error: '扫描层级不合法' }, { status: 400 })
    }

    const rows = await db
      .select({ id: ScannerTable.id })
      .from(ScannerTable)
      .where(eq(ScannerTable.id, scannerId))
      .limit(1)

    if (!rows[0]) {
      return NextResponse.json({ error: '扫描目录不存在' }, { status: 404 })
    }

    const now = dayjs().toISOString()

    const updated = await db
      .update(ScannerTable)
      .set({
        directory,
        provider,
        scanMode,
        scanLevel,
        updatedAt: now,
      })
      .where(eq(ScannerTable.id, scannerId))
      .returning({
        id: ScannerTable.id,
        directory: ScannerTable.directory,
        provider: ScannerTable.provider,
        progress: ScannerTable.progress,
        gameCount: ScannerTable.gameCount,
        scanMode: ScannerTable.scanMode,
        scanLevel: ScannerTable.scanLevel,
        excludeDirs: ScannerTable.excludeDirs,
        createdAt: ScannerTable.createdAt,
        updatedAt: ScannerTable.updatedAt,
      })

    return NextResponse.json({ data: updated[0] })
  } catch (error) {
    console.error('Update scanner failed:', error)
    return NextResponse.json(
      { error: 'Failed to update scanner' },
      { status: 500 },
    )
  }
}

const deleteScanner = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const scannerId = Number(id)

    if (!Number.isInteger(scannerId) || scannerId <= 0) {
      return NextResponse.json({ error: 'Invalid scanner id' }, { status: 400 })
    }

    await db.delete(ScannerTable).where(eq(ScannerTable.id, scannerId))

    return NextResponse.json({
      data: {
        deleted: true,
        id: scannerId,
      },
    })
  } catch (error) {
    console.error('Delete scanner failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete scanner' },
      { status: 500 },
    )
  }
}

export { updateScanner as PATCH, deleteScanner as DELETE }
