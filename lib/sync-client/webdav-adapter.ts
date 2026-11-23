import { WebDAVClient } from '@/lib/webdav-utils'

import type {
  RemoteBackupInfo,
  SyncClient,
  SyncConnectionConfig,
  SyncProgressCallback,
} from '@/lib/sync-client/types'

/** 将现有 WebDAV 客户端适配为统一 SyncClient 接口 */
export class WebDAVSyncClient implements SyncClient {
  private client: WebDAVClient

  constructor(config: SyncConnectionConfig) {
    this.client = new WebDAVClient({
      server: config.server || '',
      username: config.username || '',
      password: config.password || '',
      remotePath: config.remotePath,
    })
  }

  testConnection(): Promise<boolean> {
    return this.client.testConnection()
  }

  async listDirectory(remotePath?: string) {
    const contents = await this.client.listDirectory(remotePath)
    return contents.map((item) => ({
      basename: item.basename,
      type: (item.type === 'directory' ? 'directory' : 'file') as 'file' | 'directory',
      size: item.size,
      lastmod: item.lastmod,
    }))
  }

  createDirectory(remotePath: string): Promise<void> {
    return this.client.createDirectory(remotePath)
  }

  uploadFile(
    localPath: string,
    remotePath: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    return this.client.uploadFile(localPath, remotePath, onProgress)
  }

  downloadFile(
    remotePath: string,
    localPath: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    return this.client.downloadFile(remotePath, localPath, onProgress)
  }

  uploadDirectory(
    localDir: string,
    remoteDir: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    return this.client.uploadDirectory(localDir, remoteDir, onProgress)
  }

  downloadDirectory(
    remoteDir: string,
    localDir: string,
    onProgress?: SyncProgressCallback,
  ): Promise<void> {
    return this.client.downloadDirectory(remoteDir, localDir, onProgress)
  }

  async listBackupDirectories(): Promise<RemoteBackupInfo[]> {
    return this.client.listBackupDirectories()
  }

  deleteRemoteDirectory(remoteDir: string): Promise<void> {
    return this.client.deleteRemoteDirectory(remoteDir)
  }
}
