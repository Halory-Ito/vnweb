import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

import { ScannerTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const scannerId = Number(id)

    if (!Number.isInteger(scannerId) || scannerId <= 0) {
      return NextResponse.json({ error: '无效的扫描器 ID' }, { status: 400 })
    }

    // 获取扫描器配置
    const scanner = await db
      .select()
      .from(ScannerTable)
      .where(eq(ScannerTable.id, scannerId))
      .limit(1)

    if (!scanner[0]) {
      return NextResponse.json({ error: '扫描器不存在' }, { status: 404 })
    }

    const { directory, scanMode, scanLevel, excludeDirs } = scanner[0]

    // 检查目录是否存在
    if (!fs.existsSync(directory)) {
      return NextResponse.json({ error: '扫描目录不存在' }, { status: 400 })
    }

    // 获取排除目录列表
    const excludeList = excludeDirs
      ? excludeDirs.split(',').map((d) => d.trim().toLowerCase())
      : []

    // 获取子目录列表
    const entries = await fs.promises.readdir(directory, {
      withFileTypes: true,
    })
    const subdirs: Array<{
      name: string
      path: string
      hasExe: boolean
    }> = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const subdirPath = path.join(directory, entry.name)

      // 检查是否在排除列表中
      if (excludeList.includes(entry.name.toLowerCase())) continue

      // 检查是否包含 exe 文件
      let hasExe = false
      try {
        const files = await fs.promises.readdir(subdirPath)
        hasExe = files.some((f) => f.endsWith('.exe'))
      } catch {
        // ignore
      }

      subdirs.push({
        name: entry.name,
        path: subdirPath,
        hasExe,
      })
    }

    return NextResponse.json({
      data: {
        directory,
        scanMode,
        scanLevel,
        subdirs,
      },
    })
  } catch (error) {
    console.error('Get subdirs failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '获取子目录列表失败' },
      { status: 500 },
    )
  }
}
