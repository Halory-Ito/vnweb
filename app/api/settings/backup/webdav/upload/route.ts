import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { createTask, finishTask, getTask, updateTask } from '@/lib/webdav-progress'
import { getWebDAVConfig, WebDAVClient } from '@/lib/webdav-utils'

// 获取数据库路径
function getDbPath() {
  const dbUrl = process.env.DB_FILE_NAME?.trim() || 'file:./local.db'
  if (dbUrl.startsWith('file:')) {
    return path.join(process.cwd(), dbUrl.replace('file:', ''))
  }
  return dbUrl
}

// 获取游戏存档配置
async function getGameSaveConfig(): Promise<{
  enabled: boolean
  directory: string
}> {
  try {
    const configFile = path.join(process.cwd(), 'app', 'config.json')
    if (fs.existsSync(configFile)) {
      const content = await fs.promises.readFile(configFile, 'utf-8')
      const config = JSON.parse(content)
      const settings = (config['settings'] || {}) as Record<string, unknown>
      const backup = (settings['backup'] || {}) as Record<string, unknown>
      const save = (backup['save'] || {}) as Record<string, unknown>
      return {
        enabled: Boolean(save.active),
        directory: typeof save.dir === 'string' ? save.dir : '',
      }
    }
  } catch {
    // ignore
  }
  return { enabled: false, directory: '' }
}

// 计算文件或目录的总大小
async function calculateSize(target: string): Promise<number> {
  const stat = await fs.promises.stat(target)
  if (stat.isFile()) {
    return stat.size
  }
  let total = 0
  const entries = await fs.promises.readdir(target, { withFileTypes: true })
  for (const entry of entries) {
    total += await calculateSize(path.join(target, entry.name))
  }
  return total
}

// 启动上传任务
export async function POST(_req: NextRequest) {
  try {
    // 获取WebDAV配置
    const config = await getWebDAVConfig()
    if (!config) {
      return NextResponse.json(
        { error: 'WebDAV配置未设置，请先在设置中配置WebDAV' },
        { status: 400 },
      )
    }

    const client = new WebDAVClient(config)

    // 测试连接
    const connected = await client.testConnection()
    if (!connected) {
      return NextResponse.json({ error: '无法连接到WebDAV服务器，请检查配置' }, { status: 400 })
    }

    // 收集需要上传的内容：游戏存档目录 + local.db
    const gameSaveConfig = await getGameSaveConfig()
    const gameSaveDir =
      gameSaveConfig.enabled && gameSaveConfig.directory ? gameSaveConfig.directory.trim() : ''
    const dbPath = getDbPath()

    if (!gameSaveDir || !fs.existsSync(gameSaveDir)) {
      return NextResponse.json(
        { error: '游戏存档目录未设置或不存在，请先在设置中配置游戏存档' },
        { status: 400 },
      )
    }
    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: '数据库文件不存在，无法上传' }, { status: 400 })
    }

    // 计算需要上传的总大小
    let totalSize = 0
    totalSize += await calculateSize(gameSaveDir)
    totalSize += (await fs.promises.stat(dbPath)).size

    // 创建上传任务
    const taskId = randomUUID()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupDir = config.remotePath + '/vnweb-backup-' + timestamp

    const task = createTask(taskId, totalSize)
    task.message = '开始上传...'

    // 后台执行上传（不阻塞响应）
    void runUpload(client, gameSaveDir, dbPath, backupDir, taskId, totalSize)

    return NextResponse.json({
      data: {
        taskId,
        backupDir,
        totalSize,
      },
    })
  } catch (error) {
    console.error('WebDAV upload start failed:', error)
    return NextResponse.json({ error: (error as Error).message || '启动上传失败' }, { status: 500 })
  }
}

// 执行上传（后台任务）：游戏存档目录 + local.db
async function runUpload(
  client: WebDAVClient,
  gameSaveDir: string,
  dbPath: string,
  backupDir: string,
  taskId: string,
  totalSize: number,
) {
  try {
    const updateProgress = (taskId: string, uploaded: number, currentFile: string) => {
      const percent = totalSize > 0 ? Math.min(100, Math.round((uploaded / totalSize) * 100)) : 100
      updateTask(taskId, {
        uploaded,
        currentFile,
        message: '正在上传 ' + currentFile + '（' + percent + '%）',
      })
    }

    let uploaded = 0

    // 确保备份根目录存在（local.db 直接上传到根目录下）
    await client.createDirectory(backupDir)

    // 上传游戏存档目录
    await client.uploadDirectory(
      gameSaveDir,
      backupDir + '/game-saves',
      (loaded, total, currentFile) => {
        const base = uploaded
        updateProgress(
          taskId,
          base + loaded,
          currentFile ? 'game-saves/' + currentFile : 'game-saves/',
        )
        void total
      },
    )
    uploaded += await calculateSize(gameSaveDir)

    // 上传local.db文件
    const dbSize = (await fs.promises.stat(dbPath)).size
    await client.uploadFile(dbPath, backupDir + '/local.db', (loaded) => {
      updateProgress(taskId, uploaded + loaded, 'local.db')
    })
    uploaded += dbSize

    finishTask(taskId, 'success', '上传完成')
  } catch (error) {
    console.error('WebDAV upload failed:', error)
    finishTask(taskId, 'error', '上传失败', (error as Error).message)
  }
}

// 查询上传进度
export async function GET(req: NextRequest) {
  const taskId = req.nextUrl.searchParams.get('taskId')
  if (!taskId) {
    return NextResponse.json({ error: '缺少 taskId' }, { status: 400 })
  }

  const task = getTask(taskId)
  if (!task) {
    return NextResponse.json({ error: '任务不存在或已过期' }, { status: 404 })
  }

  return NextResponse.json({ data: task })
}
