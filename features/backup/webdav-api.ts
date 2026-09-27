import { api } from '@/lib/request-utils'

export type WebDAVConfigData = {
  server: string
  username: string
  password: string
  remotePath: string
}

export type RemoteBackupInfo = {
  name: string
  size: number
  lastmod: string
}

export type WebDAVTaskProgress = {
  taskId: string
  status: 'running' | 'success' | 'error'
  total: number
  uploaded: number
  currentFile: string
  message: string
  error?: string
}

// 获取WebDAV配置
export function getWebDAVConfigApi() {
  return api.request({
    method: 'GET',
    url: '/settings/backup/webdav',
  })
}

// 保存WebDAV配置
export function saveWebDAVConfigApi(payload: WebDAVConfigData) {
  return api.request({
    method: 'POST',
    url: '/settings/backup/webdav',
    data: payload,
  })
}

// 测试WebDAV连接
export function testWebDAVConnectionApi(payload: WebDAVConfigData) {
  return api.request({
    method: 'POST',
    url: '/settings/backup/webdav/test',
    data: payload,
  })
}

// 启动上传备份任务（返回 taskId）
export function startUploadWebDAVBackupApi() {
  return api.request({
    method: 'POST',
    url: '/settings/backup/webdav/upload',
  })
}

// 查询上传任务进度
export function getUploadWebDAVProgressApi(taskId: string) {
  return api.request({
    method: 'GET',
    url: '/settings/backup/webdav/upload',
    params: { taskId },
  })
}

// 列出远程备份
export function listWebDAVBackupsApi() {
  return api.request({
    method: 'GET',
    url: '/settings/backup/webdav/list',
  })
}

// 从WebDAV下载备份并覆盖本地
export function downloadWebDAVBackupApi(backupName: string) {
  return api.request({
    method: 'POST',
    url: '/settings/backup/webdav/download',
    data: { backupName },
  })
}
