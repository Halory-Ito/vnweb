import { api } from '@/lib/request-utils'

import type { SyncServerConfig } from '@/types'

export type { SyncServerConfig }

export type RemoteBackupInfo = {
  name: string
  size: number
  lastmod: string
}

export type SyncTaskProgress = {
  taskId: string
  status: 'running' | 'success' | 'error'
  total: number
  uploaded: number
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

// 启动上传备份任务（返回 taskId）
export function startUploadSyncBackupApi() {
  return api.request({ method: 'POST', url: `${BASE_URL}/upload` })
}

// 查询上传任务进度
export function getUploadSyncProgressApi(taskId: string) {
  return api.request({ method: 'GET', url: `${BASE_URL}/upload`, params: { taskId } })
}

// 列出远程备份
export function listSyncBackupsApi() {
  return api.request({ method: 'GET', url: `${BASE_URL}/list` })
}

// 从同步服务器下载备份并覆盖本地
export function downloadSyncBackupApi(backupName: string) {
  return api.request({
    method: 'POST',
    url: `${BASE_URL}/download`,
    data: { backupName },
  })
}
