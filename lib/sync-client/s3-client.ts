import {
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'

import type {
  RemoteBackupInfo,
  SyncClient,
  SyncConnectionConfig,
  SyncProgressCallback,
} from '@/lib/sync-client/types'

const CONCURRENCY = 4

/** 规范化 S3 key：去除首尾斜杠，目录前缀末尾补斜杠 */
function normalizeKey(key: string): string {
  return key.replace(/^\/+|\/+$/g, '')
}

/** S3 兼容对象存储客户端（用 key 前缀模拟目录） */
export class S3SyncClient implements SyncClient {
  private client: S3Client
  private bucket: string
  private basePrefix: string

  constructor(config: SyncConnectionConfig) {
    this.bucket = config.bucket || ''
    this.basePrefix = normalizeKey(config.remotePath || 'vnweb-backup')
    this.client = new S3Client({
      region: config.region || 'us-east-1',
      endpoint: config.endpoint || undefined,
      forcePathStyle: config.forcePathStyle ?? true,
      credentials: {
        accessKeyId: config.accessKeyId || '',
        secretAccessKey: config.secretAccessKey || '',
      },
      maxAttempts: 3,
    })
  }

  /** 拼接完整对象 key */
  private buildKey(remotePath?: string): string {
    const rest = normalizeKey(remotePath || '')
    return rest ? `${this.basePrefix}/${rest}` : this.basePrefix
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }))
      return true
    } catch (error) {
      console.error('S3 connection test failed:', error)
      return false
    }
  }

  async listDirectory(
    remotePath?: string,
  ): Promise<
    Array<{ basename: string; type: 'file' | 'directory'; size: number; lastmod: string }>
  > {
    const prefix = `${this.buildKey(remotePath)}/`
    const result: Array<{
      basename: string
      type: 'file' | 'directory'
      size: number
      lastmod: string
    }> = []

    let continuationToken: string | undefined
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        }),
      )

      for (const item of response.CommonPrefixes ?? []) {
        if (!item.Prefix) continue
        const basename = item.Prefix.slice(prefix.length).replace(/\/$/, '')
        if (basename) {
          result.push({ basename, type: 'directory', size: 0, lastmod: '' })
        }
      }
      for (const item of response.Contents ?? []) {
        if (!item.Key || item.Key === prefix) continue
        const basename = item.Key.slice(prefix.length)
        if (!basename || basename.includes('/')) continue
        result.push({
          basename,
          type: 'file',
          size: item.Size ?? 0,
          lastmod: item.LastModified?.toISOString() ?? '',
        })
      }
      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return result
  }

  async createDirectory(): Promise<void> {
    // S3 无真实目录概念，key 前缀天然表示目录，无需操作
  }

  async uploadFile(
    localPath: string,
    remotePath: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    const body = await fs.promises.readFile(localPath)
    const total = body.length
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.buildKey(remotePath),
        Body: body,
        ContentType: 'application/octet-stream',
      }),
    )
    onProgress?.(total, total, path.basename(localPath))
  }

  async downloadFile(
    remotePath: string,
    localPath: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.buildKey(remotePath) }),
    )
    if (!response.Body) {
      throw new Error('S3 对象为空')
    }

    const localDir = path.dirname(localPath)
    await fs.promises.mkdir(localDir, { recursive: true })

    const total = response.ContentLength ?? 0
    const chunks: Buffer[] = []
    const stream = response.Body as Readable
    let loaded = 0
    for await (const chunk of stream) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      chunks.push(buffer)
      loaded += buffer.length
      onProgress?.(loaded, total, path.basename(localPath))
    }
    await fs.promises.writeFile(localPath, Buffer.concat(chunks))
  }

  async uploadDirectory(
    localDir: string,
    remoteDir: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    const files: Array<{ localPath: string; remotePath: string }> = []
    const collect = async (dir: string, remote: string) => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true })
      for (const entry of entries) {
        const localPath = path.join(dir, entry.name)
        const remotePath = `${remote}/${entry.name}`
        if (entry.isDirectory()) {
          await collect(localPath, remotePath)
        } else {
          files.push({ localPath, remotePath })
        }
      }
    }
    await collect(localDir, remoteDir)

    let totalSize = 0
    for (const file of files) {
      totalSize += (await fs.promises.stat(file.localPath)).size
    }

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
            const relativePath = path.relative(localDir, file.localPath).split(path.sep).join('/')
            onProgress?.(uploaded + loaded, totalSize, relativePath)
          })
          uploaded += fileSize
        } catch (error) {
          errors.push(error as Error)
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()))
    if (errors.length > 0) throw errors[0]
  }

  async downloadDirectory(
    remoteDir: string,
    localDir: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    const files = await this.collectRemoteFiles(remoteDir, localDir)
    const totalSize = files.reduce((sum, file) => sum + file.size, 0)

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
            const relativePath = path.relative(localDir, file.localPath).split(path.sep).join('/')
            onProgress?.(downloaded + loaded, totalSize, relativePath)
          })
          downloaded += file.size
        } catch (error) {
          errors.push(error as Error)
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker()))
    if (errors.length > 0) throw errors[0]
  }

  /** 递归收集远端对象（S3 前缀即目录） */
  private async collectRemoteFiles(
    remoteDir: string,
    localDir: string,
  ): Promise<Array<{ remotePath: string; localPath: string; size: number }>> {
    const prefix = `${this.buildKey(remoteDir)}/`
    const files: Array<{ remotePath: string; localPath: string; size: number }> = []
    let continuationToken: string | undefined
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      )
      for (const item of response.Contents ?? []) {
        if (!item.Key || item.Key.endsWith('/')) continue
        const relative = item.Key.slice(prefix.length)
        if (!relative) continue
        files.push({
          remotePath: item.Key,
          localPath: path.join(localDir, ...relative.split('/')),
          size: item.Size ?? 0,
        })
      }
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
    return files
  }

  async listBackupDirectories(): Promise<RemoteBackupInfo[]> {
    const prefix = `${this.basePrefix}/`
    const names = new Map<string, RemoteBackupInfo>()

    let continuationToken: string | undefined
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          Delimiter: '/',
          ContinuationToken: continuationToken,
        }),
      )
      for (const item of response.CommonPrefixes ?? []) {
        if (!item.Prefix) continue
        const name = item.Prefix.slice(prefix.length).replace(/\/$/, '')
        if (name.startsWith('vnweb-backup-')) {
          names.set(name, { name, size: 0, lastmod: '' })
        }
      }
      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return [...names.values()].sort((a, b) => (a.name < b.name ? 1 : -1))
  }

  async deleteRemoteDirectory(remoteDir: string): Promise<void> {
    const prefix = `${this.buildKey(remoteDir)}/`
    let continuationToken: string | undefined
    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      )
      const keys = (response.Contents ?? [])
        .map((item) => item.Key)
        .filter((key): key is string => Boolean(key))
      if (keys.length > 0) {
        await this.client.send(
          new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: { Objects: keys.map((Key) => ({ Key })) },
          }),
        )
      }
      continuationToken = response.NextContinuationToken
    } while (continuationToken)
  }
}
