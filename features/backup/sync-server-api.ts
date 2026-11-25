import { api } from '@/lib/request-utils'

import type {
  BackupContentOptions,
  BackupImageCategoryKey,
  RemoteBackupStatus,
  SyncDownloadPreviewSummary,
  SyncServerConfig,
  SyncUploadPreviewSummary,
} from '@/types'

export type {
  BackupContentOptions,
  BackupImageCategoryKey,
  RemoteBackupStatus,
  SyncDownloadPreviewSummary,
  SyncServerConfig,
  SyncUploadPreviewSummary,
}

export type RemoteBackupInfo = {
  name: string
  size: number
  lastmod: string
}

export type SyncTaskProgress = {
  taskId: string
  type?: 'upload' | 'download'
  stage?: string
  status: 'running' | 'success' | 'error'
  total: number
  uploaded: number
  transferred?: number
  archiveSize?: number
  uncompressedSize?: number
  backupDir?: string
  percent: number
  currentCategory: string
  categories: string[]
  currentFile: string
  message: string
  error?: string
}

export type SyncConfigResponse = {
  configs: SyncServerConfig[]
  autoBackup: boolean
  autoBackupInterval: number
}

/** 测试连接用的 payload（整个配置，密码可传掩码） */
export type SyncConnectionPayload = SyncServerConfig

const BASE_URL = '/settings/backup/sync-server'

// 获取备份内容可选项配置
export function getBackupContentConfigApi() {
  return api.request<{ data: BackupContentOptions }>({
    method: 'GET',
    url: '/settings/backup/content',
  })
}

// 更新备份内容可选项配置
export function updateBackupContentConfigApi(options: BackupContentOptions) {
  return api.request<{ data: BackupContentOptions }>({
    method: 'PUT',
    url: '/settings/backup/content',
    data: options,
  })
}

// 获取配置列表
export function getSyncConfigsApi() {
  return api.request({ method: 'GET', url: BASE_URL })
}

// 新增配置
export function createSyncConfigApi(payload: Omit<SyncServerConfig, 'id'>) {
  return api.request({ method: 'POST', url: BASE_URL, data: payload })
}

// 更新配置
export function updateSyncConfigApi(payload: SyncServerConfig) {
  return api.request({ method: 'PUT', url: BASE_URL, data: payload })
}

// 删除配置
export function deleteSyncConfigApi(id: string) {
  return api.request({ method: 'DELETE', url: BASE_URL, params: { id } })
}

// 测试连接
export function testSyncConnectionApi(payload: SyncConnectionPayload) {
  return api.request({ method: 'POST', url: `${BASE_URL}/test`, data: payload })
}

// 查询上传前备份统计
export function getUploadSyncPreviewApi() {
  return api.request<{ data: SyncUploadPreviewSummary }>({
    method: 'GET',
    url: `${BASE_URL}/upload/preview`,
  })
}

// 启动上传备份任务（返回 taskId）
export function startUploadSyncBackupApi(options?: BackupContentOptions) {
  return api.request({
    method: 'POST',
    url: `${BASE_URL}/upload`,
    data: options ? { options, saveOptions: true } : undefined,
  })
}

// 查询上传任务进度
export function getUploadSyncProgressApi(taskId: string) {
  return api.request({ method: 'GET', url: `${BASE_URL}/upload`, params: { taskId } })
}

// 检测远端最新备份日期与元信息
export function getRemoteBackupStatusApi() {
  return api.request<{ data: RemoteBackupStatus }>({
    method: 'GET',
    url: `${BASE_URL}/status`,
  })
}

// 查询下载前远端备份统计
export function getDownloadSyncPreviewApi() {
  return api.request<{ data: SyncDownloadPreviewSummary }>({
    method: 'GET',
    url: `${BASE_URL}/download/preview`,
  })
}

// 列出远程备份
export function listSyncBackupsApi() {
  return api.request({ method: 'GET', url: `${BASE_URL}/list` })
}

// 启动从同步服务器下载备份任务（返回 taskId）
export function startDownloadSyncBackupApi(backupName?: string) {
  return api.request<{ data: { taskId: string; backupName: string } }>({
    method: 'POST',
    url: `${BASE_URL}/download`,
    data: backupName ? { backupName } : {},
  })
}

// 查询下载任务进度
export function getDownloadSyncProgressApi(taskId: string) {
  return api.request<{ data: SyncTaskProgress }>({
    method: 'GET',
    url: `${BASE_URL}/download`,
    params: { taskId },
  })
}
