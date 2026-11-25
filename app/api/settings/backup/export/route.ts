import archiver from 'archiver'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'

import {
  collectBackupSettingsFiles,
  collectSelectedBackupAssets,
} from '@/lib/server/backup-content'
import {
  readBackupContentConfig,
  readGameSaveBackupConfig as getGameSaveConfig,
} from '@/lib/server/config-rw'
import { getDbPath } from '@/lib/server/database-config.mjs'

export async function POST(_req: NextRequest) {
  try {
    const options = await readBackupContentConfig()
    const [assetFiles, settingsFiles] = await Promise.all([
      collectSelectedBackupAssets(options),
      collectBackupSettingsFiles(),
    ])

    // 创建归档
    const archive = archiver('zip', { zlib: { level: 9 } })

    // 设置响应头
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const fileName = `vnweb-backup-${timestamp}.zip`

    const chunks: Uint8Array[] = []
    archive.on('data', (chunk: Uint8Array) => {
      chunks.push(chunk)
    })

    // 1. 导出数据库
    const dbPath = getDbPath()
    if (fs.existsSync(dbPath)) {
      const dbBuffer = fs.readFileSync(dbPath)
      archive.append(dbBuffer, { name: 'database/local.db' })
    }

    // 2. 按所选分类导出静态资源
    for (const file of assetFiles) {
      archive.file(file.localPath, { name: file.archivePath })
    }

    // 3. 导出所有设置文件
    for (const file of settingsFiles) {
      archive.file(file.localPath, { name: file.archivePath })
    }

    // 4. 导出游戏存档目录
    if (options.gameSaves) {
      const gameSaveConfig = await getGameSaveConfig()
      if (gameSaveConfig.enabled && gameSaveConfig.directory) {
        const saveDir = gameSaveConfig.directory.trim()
        if (saveDir && fs.existsSync(saveDir)) {
          archive.directory(saveDir, 'game-saves')
        }
      }
    }

    // 4. 添加备份元信息
    const backupInfo = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      description: 'VNWeb Database Backup',
      content: options,
    }
    archive.append(JSON.stringify(backupInfo, null, 2), {
      name: 'backup-info.json',
    })

    // 完成归档
    await new Promise<void>((resolve, reject) => {
      archive.on('end', () => resolve())
      archive.on('error', (err: Error) => reject(err))
      archive.finalize()
    })

    // 合并所有 chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return new NextResponse(result, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Export backup failed:', error)
    return NextResponse.json({ error: (error as Error).message || '导出备份失败' }, { status: 500 })
  }
}
