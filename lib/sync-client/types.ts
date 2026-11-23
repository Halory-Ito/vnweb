import type { SyncProvider } from '@/types'

/** 同步客户端连接配置（从存储节点解析而来，字段按 provider 使用） */
export type SyncConnectionConfig = {
  provider: SyncProvider
  remotePath: string

  // WebDAV
  server?: string
  username?: string
  password?: string

  // S3 兼容对象存储
  endpoint?: string
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: boolean
}

export type RemoteBackupInfo = {
  name: string
  size: number
  lastmod: string
}

export type SyncProgressCallback = (loaded: number, total: number, currentFile?: string) => void

/** 所有同步后端需实现的统一接口 */
export interface SyncClient {
  testConnection(): Promise<boolean>
  listDirectory(
    remotePath?: string,
  ): Promise<Array<{ basename: string; type: 'file' | 'directory'; size: number; lastmod: string }>>
  createDirectory(remotePath: string): Promise<void>
  uploadFile(
    localPath: string,
    remotePath: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void>
  downloadFile(
    remotePath: string,
    localPath: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void>
  uploadDirectory(
    localDir: string,
    remoteDir: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void>
  downloadDirectory(
    remoteDir: string,
    localDir: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void>
  listBackupDirectories(): Promise<RemoteBackupInfo[]>
  deleteRemoteDirectory(remoteDir: string): Promise<void>
}
