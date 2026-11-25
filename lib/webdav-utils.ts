import axios, { AxiosInstance } from 'axios'
import fs from 'node:fs'
import path from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { createClient, FileStat, WebDAVClient as WebDAVClientInstance } from 'webdav'

import { getLegacyWebdavConfigPath } from '@/lib/server/runtime-paths.mjs'

export interface WebDAVConfig {
  server: string
  username: string
  password: string
  remotePath: string
}

export interface RemoteBackupInfo {
  name: string
  size: number
  lastmod: string
}

export type ProgressCallback = (loaded: number, total: number, currentFile?: string) => void

// WebDAV 传输超时（毫秒），默认 10 分钟
const DEFAULT_TIMEOUT = 10 * 60 * 1000

export class WebDAVClient {
  private client: WebDAVClientInstance
  private axios: AxiosInstance
  private config: WebDAVConfig
  private timeout: number

  constructor(config: WebDAVConfig, timeout: number = DEFAULT_TIMEOUT) {
    // 规范化 remotePath，去除尾部斜杠保证路径拼接一致（保留前导斜杠）
    const remotePath = (config.remotePath || '/vnweb-backup').replace(/\/+$/g, '')
    this.config = {
      ...config,
      remotePath,
    }
    this.timeout = timeout
    this.client = createClient(config.server, {
      username: config.username,
      password: config.password,
    })
    // 文件传输使用 axios，便于控制超时与上报进度
    this.axios = axios.create({
      baseURL: config.server,
      auth: {
        username: config.username,
        password: config.password,
      },
      timeout: this.timeout,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    })
  }

  // 拼接远程 URL（处理 server 尾斜杠与 remotePath，逐段编码以兼容中文与特殊字符）
  private buildUrl(remotePath: string): string {
    const server = this.config.server.replace(/\/+$/, '')
    const encodedPath = remotePath
      .split('/')
      .map((segment) => (segment ? encodeURIComponent(segment) : ''))
      .join('/')
    return `${server}${encodedPath.startsWith('/') ? encodedPath : `/${encodedPath}`}`
  }

  // 测试连接（远程目录不存在时自动创建后再次确认）
  async testConnection(): Promise<boolean> {
    try {
      await this.client.getDirectoryContents(this.config.remotePath)
      return true
    } catch {
      try {
        // 目录可能尚未创建，尝试创建后再确认
        await this.createDirectory(this.config.remotePath)
        await this.client.getDirectoryContents(this.config.remotePath)
        return true
      } catch (innerError) {
        console.error('WebDAV connection test failed:', innerError)
        return false
      }
    }
  }

  // 上传内存缓冲区内容（如 JSON 元信息）
  async uploadBuffer(
    content: Buffer | string,
    remotePath: string,
    contentType = 'application/octet-stream',
  ): Promise<void> {
    const body = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content
    await this.axios.put(this.buildUrl(remotePath), body, {
      headers: {
        'Content-Type': contentType,
      },
    })
  }

  // 下载内存缓冲区内容（不存在时返回 null）
  async downloadBuffer(remotePath: string): Promise<Buffer | null> {
    try {
      const response = await this.axios.get(this.buildUrl(remotePath), {
        responseType: 'arraybuffer',
      })
      return Buffer.from(response.data)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null
      }
      throw error
    }
  }

  // 递归列出目录下全部文件（相对路径与大小）
  async listFilesRecursive(
    remoteDir: string,
  ): Promise<Array<{ relativePath: string; size: number; lastmod: string }>> {
    const files: Array<{ relativePath: string; size: number; lastmod: string }> = []
    const walk = async (remote: string, prefix: string) => {
      const contents = await this.listDirectory(remote)
      for (const item of contents) {
        if (!item.basename || item.basename === '.' || item.basename === '..') continue
        const nextRelative = prefix ? `${prefix}/${item.basename}` : item.basename
        if (item.type === 'directory') {
          await walk(`${remote}/${item.basename}`, nextRelative)
        } else {
          files.push({
            relativePath: nextRelative,
            size: item.size,
            lastmod: item.lastmod,
          })
        }
      }
    }
    await walk(remoteDir.replace(/\/+$/g, ''), '')
    return files
  }

  // 列出目录内容
  async listDirectory(remotePath?: string): Promise<FileStat[]> {
    const targetPath = remotePath || this.config.remotePath
    const contents = await this.client.getDirectoryContents(targetPath)
    return contents
  }

  // 创建目录（递归创建，已存在时忽略错误）
  async createDirectory(remotePath: string): Promise<void> {
    try {
      await this.client.createDirectory(remotePath, { recursive: true })
    } catch (error) {
      // 目录已存在等错误直接忽略
      const status = (error as { status?: number })?.status
      if (status !== 405 && status !== 409 && status !== 301) {
        throw error
      }
    }
  }

  // 上传单个文件（流式上传并实时回调进度）
  async uploadFile(
    localPath: string,
    remotePath: string,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    const stat = await fs.promises.stat(localPath)
    const total = stat.size
    let loaded = 0
    onProgress?.(0, total, path.basename(localPath))

    const progressStream = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        loaded += chunk.length
        onProgress?.(Math.min(loaded, total), total, path.basename(localPath))
        callback(null, chunk)
      },
    })

    const fileStream = fs.createReadStream(localPath)
    const bodyStream = fileStream.pipe(progressStream)

    try {
      await this.axios.put(this.buildUrl(remotePath), bodyStream, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(total),
        },
      })
    } finally {
      fileStream.destroy()
      progressStream.destroy()
    }
  }

  // 下载单个文件（流式落盘并实时回调进度）
  async downloadFile(
    remotePath: string,
    localPath: string,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    const localDir = path.dirname(localPath)
    await fs.promises.mkdir(localDir, { recursive: true })

    const response = await this.axios.get(this.buildUrl(remotePath), {
      responseType: 'stream',
    })

    const headerLength = Number(response.headers?.['content-length'])
    const total = Number.isFinite(headerLength) && headerLength > 0 ? headerLength : 0
    let loaded = 0
    onProgress?.(0, total, path.basename(localPath))

    const progressStream = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        loaded += chunk.length
        onProgress?.(loaded, total, path.basename(localPath))
        callback(null, chunk)
      },
    })

    const writeStream = fs.createWriteStream(localPath)
    try {
      await pipeline(response.data as NodeJS.ReadableStream, progressStream, writeStream)
    } catch (error) {
      await fs.promises.rm(localPath, { force: true }).catch(() => {})
      throw error
    }
  }

  // 递归上传目录（支持进度回调，回调参数为累计字节数与总字节数）
  // 使用并发上传显著提升速度（串行时每个文件都要等服务器响应）
  async uploadDirectory(
    localDir: string,
    remoteDir: string,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    // 确保远程目录存在
    await this.createDirectory(remoteDir)

    // 收集所有文件（扁平化），避免递归回调累加重复
    const files: Array<{ localPath: string; remotePath: string }> = []
    const collect = async (dir: string, remote: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const localPath = path.join(dir, entry.name)
        const remotePath = `${remote}/${entry.name}`
        if (entry.isDirectory()) {
          await this.createDirectory(remotePath)
          await collect(localPath, remotePath)
        } else {
          files.push({ localPath, remotePath })
        }
      }
    }
    await collect(localDir, remoteDir)

    // 统计目录总大小
    const totalSize = await this.calculateDirSize(localDir)

    // 并发上传（默认 4 并发），大幅提升速度
    await this.uploadFilesConcurrent(files, localDir, totalSize, onProgress)
  }

  // 并发上传文件列表
  private async uploadFilesConcurrent(
    files: Array<{ localPath: string; remotePath: string }>,
    baseDir: string,
    totalSize: number,
    onProgress?: ProgressCallback,
    concurrency = 4,
  ): Promise<void> {
    let nextIndex = 0
    let uploaded = 0
    const errors: Error[] = []

    const worker = async () => {
      while (true) {
        const index = nextIndex++
        if (index >= files.length) break

        const file = files[index]
        const fileSize = (await fs.promises.stat(file.localPath)).size
        try {
          await this.uploadFile(file.localPath, file.remotePath, (loaded) => {
            if (onProgress) {
              const relativePath = path.relative(baseDir, file.localPath).split(path.sep).join('/')
              onProgress(uploaded + loaded, totalSize, relativePath)
            }
          })
          uploaded += fileSize
        } catch (error) {
          errors.push(error as Error)
        }
      }
    }

    const workers = Array.from({ length: Math.min(concurrency, files.length) }, () => worker())
    await Promise.all(workers)

    // 有错误时抛出第一个错误
    if (errors.length > 0) {
      throw errors[0]
    }
  }

  // 递归下载目录（支持进度回调，回调参数为累计字节数与总字节数）
  async downloadDirectory(
    remoteDir: string,
    localDir: string,
    onProgress?: ProgressCallback,
  ): Promise<void> {
    // 确保本地目录存在
    await fs.promises.mkdir(localDir, { recursive: true })

    // 收集所有远程文件（扁平化）
    const files: Array<{ remotePath: string; localPath: string; size: number }> = []
    const collect = async (remote: string, local: string) => {
      const contents = await this.listDirectory(remote)
      for (const item of contents) {
        const remotePath = `${remote}/${item.basename}`
        const localPath = path.join(local, item.basename)
        if (item.type === 'directory') {
          await fs.promises.mkdir(localPath, { recursive: true })
          await collect(remotePath, localPath)
        } else {
          files.push({ remotePath, localPath, size: item.size })
        }
      }
    }
    await collect(remoteDir, localDir)

    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    // 并发下载（默认 4 并发）
    let nextIndex = 0
    let downloaded = 0
    const errors: Error[] = []

    const worker = async () => {
      while (true) {
        const index = nextIndex++
        if (index >= files.length) break

        const file = files[index]
        try {
          await this.downloadFile(file.remotePath, file.localPath, (loaded) => {
            if (onProgress) {
              const relativePath = path.relative(localDir, file.localPath).split(path.sep).join('/')
              onProgress(downloaded + loaded, totalSize, relativePath)
            }
          })
          downloaded += file.size
        } catch (error) {
          errors.push(error as Error)
        }
      }
    }

    const workers = Array.from({ length: Math.min(4, files.length) }, () => worker())
    await Promise.all(workers)

    if (errors.length > 0) {
      throw errors[0]
    }
  }

  // 计算目录总大小
  private async calculateDirSize(dir: string): Promise<number> {
    let total = 0
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        total += await this.calculateDirSize(full)
      } else {
        const stat = await fs.promises.stat(full)
        total += stat.size
      }
    }
    return total
  }

  // 列出远程备份目录（remotePath 下以 vnweb-backup- 开头的目录）
  async listBackupDirectories(): Promise<RemoteBackupInfo[]> {
    // 远程目录不存在时返回空列表
    const exists = await this.client.exists(this.config.remotePath)
    if (!exists) {
      return []
    }
    const contents = await this.listDirectory()
    return contents
      .filter((item) => item.type === 'directory' && item.basename.startsWith('vnweb-backup-'))
      .sort((a, b) => (a.basename < b.basename ? 1 : -1))
      .map((item) => ({
        name: item.basename,
        size: item.size,
        lastmod: item.lastmod,
      }))
  }

  // 删除远程备份目录
  async deleteRemoteDirectory(remoteDir: string): Promise<void> {
    try {
      await this.client.deleteFile(remoteDir)
    } catch (error) {
      console.error('Delete remote directory failed:', error)
      throw new Error('删除远程备份目录失败')
    }
  }
}

// 从存储节点中解析出当前启用的配置，兼容旧版单配置结构
export function resolveEnabledWebDAVConfig(
  webdav: Record<string, unknown> | null | undefined,
): Partial<WebDAVConfig> | null {
  if (!webdav || typeof webdav !== 'object') {
    return null
  }

  // 新版结构：configs 数组中取 enabled 项
  if (Array.isArray(webdav.configs)) {
    const enabled = (webdav.configs as Array<Record<string, unknown>>).find(
      (item) => item && typeof item === 'object' && item.enabled === true,
    )
    return enabled ? (enabled as Partial<WebDAVConfig>) : null
  }

  // 旧版结构：单个配置对象
  return webdav as Partial<WebDAVConfig>
}

// 获取协议层配置（读取同步服务器存储节点，兼容旧键与旧文件）
export async function getWebDAVConfig(): Promise<WebDAVConfig | null> {
  try {
    const { readSyncStoreNode } = await import('@/lib/server/sync-config-store')
    const node = await readSyncStoreNode()
    let config = resolveEnabledWebDAVConfig(node)

    if (!config?.server) {
      const legacyPath = getLegacyWebdavConfigPath()
      if (fs.existsSync(legacyPath)) {
        const content = await fs.promises.readFile(legacyPath, 'utf-8')
        config = JSON.parse(content) as Partial<WebDAVConfig>
      }
    }

    if (!config?.server) {
      return null
    }

    return {
      server: config.server,
      username: config.username || '',
      password: config.password || '',
      remotePath: (config.remotePath || '/vnweb-backup').replace(/\/+$/g, ''),
    }
  } catch (error) {
    console.error('Get sync server config failed:', error)
    return null
  }
}

// 保存协议层配置到同步服务器存储节点
export async function saveWebDAVConfig(config: WebDAVConfig): Promise<void> {
  const { writeSyncStoreNode } = await import('@/lib/server/sync-config-store')
  await writeSyncStoreNode(config as unknown as Record<string, unknown>)
}
