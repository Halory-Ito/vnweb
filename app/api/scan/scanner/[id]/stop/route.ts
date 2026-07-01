import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { ScannerTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

// 存储正在运行的扫描控制器
const runningScans = new Map<number, AbortController>()

export function getRunningScanController(scannerId: number) {
  return runningScans.get(scannerId)
}

export function setRunningScanController(
  scannerId: number,
  controller: AbortController,
) {
  runningScans.set(scannerId, controller)
}

export function removeRunningScanController(scannerId: number) {
  runningScans.delete(scannerId)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const scannerId = Number(id)

    if (!Number.isInteger(scannerId) || scannerId <= 0) {
      return NextResponse.json({ error: '无效的扫描器 ID' }, { status: 400 })
    }

    // 检查扫描器是否存在
    const scanner = await db
      .select()
      .from(ScannerTable)
      .where(eq(ScannerTable.id, scannerId))
      .limit(1)

    if (!scanner[0]) {
      return NextResponse.json({ error: '扫描器不存在' }, { status: 404 })
    }

    // 中断正在运行的扫描
    const controller = runningScans.get(scannerId)
    if (controller) {
      controller.abort()
      runningScans.delete(scannerId)
    }

    return NextResponse.json({
      data: {
        success: true,
        message: '扫描已中断',
      },
    })
  } catch (error) {
    console.error('Stop scan failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '中断扫描失败' },
      { status: 500 },
    )
  }
}
