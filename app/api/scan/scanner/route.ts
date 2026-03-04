import dayjs from 'dayjs'
import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { ScannerTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { GAME_PROVIDER_OPTIONS } from '@/lib/provider-options'

type CreateScannerPayload = {
  directory?: string
  provider?: string
  scanMode?: number
  scanLevel?: number
}

const providerSet = new Set(GAME_PROVIDER_OPTIONS.map((item) => item.value))

const getScanners = async () => {
  try {
    const rows = await db
      .select({
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
      .from(ScannerTable)
      .orderBy(desc(ScannerTable.id))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Get scanners failed:', error)
    return NextResponse.json(
      { error: 'Failed to get scanner list' },
      { status: 500 },
    )
  }
}

const createScanner = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as CreateScannerPayload
    const directory = (payload.directory || '').trim()
    const provider = (payload.provider || '').trim()
    const scanMode = Number(payload.scanMode)
    const scanLevel = Number(payload.scanLevel ?? 0)

    if (!directory) {
      return NextResponse.json({ error: '扫描目录不能为空' }, { status: 400 })
    }

    if (!provider) {
      return NextResponse.json({ error: '数据源不能为空' }, { status: 400 })
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

    const exists = await db
      .select({ id: ScannerTable.id })
      .from(ScannerTable)
      .where(eq(ScannerTable.directory, directory))
      .limit(1)

    if (exists[0]) {
      return NextResponse.json({ error: '该扫描目录已存在' }, { status: 400 })
    }

    const now = dayjs().toISOString()
    const inserted = await db
      .insert(ScannerTable)
      .values({
        directory,
        provider,
        scanMode,
        scanLevel,
        progress: 0,
        gameCount: 0,
        excludeDirs: '',
        createdAt: now,
        updatedAt: now,
      })
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

    return NextResponse.json({ data: inserted[0] })
  } catch (error) {
    console.error('Create scanner failed:', error)
    return NextResponse.json(
      { error: 'Failed to create scanner' },
      { status: 500 },
    )
  }
}

export { getScanners as GET, createScanner as POST }
