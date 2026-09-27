'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  downloadWebDAVBackupApi,
  getUploadWebDAVProgressApi,
  getWebDAVConfigApi,
  listWebDAVBackupsApi,
  saveWebDAVConfigApi,
  startUploadWebDAVBackupApi,
  testWebDAVConnectionApi,
  type RemoteBackupInfo,
  type WebDAVConfigData,
  type WebDAVTaskProgress,
} from '@/features/backup/webdav-api'

export type WebDAVConfigState = {
  server: string
  username: string
  password: string
  remotePath: string
}

const DEFAULT_CONFIG: WebDAVConfigState = {
  server: '',
  username: '',
  password: '',
  remotePath: '/vnweb-backup',
}

const POLL_INTERVAL = 800

export function useWebDAVBackup() {
  const [config, setConfig] = useState<WebDAVConfigState>(DEFAULT_CONFIG)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [isSavingConfig, setIsSavingConfig] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<WebDAVTaskProgress | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [backupList, setBackupList] = useState<RemoteBackupInfo[]>([])
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
  const hasLoadedRef = useRef(false)

  // 加载配置
  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }
    hasLoadedRef.current = true

    const loadConfig = async () => {
      setIsLoadingConfig(true)
      try {
        const response = await getWebDAVConfigApi()
        const data = (response.data as { data: WebDAVConfigState }).data
        setConfig({
          server: data.server || '',
          username: data.username || '',
          password: data.password || '',
          remotePath: data.remotePath || '/vnweb-backup',
        })
      } catch {
        // 未配置时保持默认值
      } finally {
        setIsLoadingConfig(false)
      }
    }
    void loadConfig()
  }, [])

  const updateConfig = (key: keyof WebDAVConfigState, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  // 测试连接
  const testConnection = useCallback(async () => {
    if (!config.server) {
      toast.error('请先填写服务器地址和用户名')
      return false
    }
    setIsTestingConnection(true)
    try {
      const payload: WebDAVConfigData = {
        server: config.server,
        username: config.username,
        // '********' 表示密码未修改，由后端读取已保存的真实密码
        password: config.password,
        remotePath: config.remotePath,
      }
      const response = await testWebDAVConnectionApi(payload)
      const data = response.data as { data: { connected: boolean; message: string } }
      toast.success(data.data.message || '连接成功')
      return true
    } catch (error) {
      toast.error((error as Error).message || '连接失败')
      return false
    } finally {
      setIsTestingConnection(false)
    }
  }, [config])

  // 保存配置
  const saveConfig = useCallback(async () => {
    if (!config.server) {
      toast.error('请填写服务器地址和用户名')
      return false
    }
    setIsSavingConfig(true)
    try {
      await saveWebDAVConfigApi(config as WebDAVConfigData)
      toast.success('WebDAV 配置已保存')
      return true
    } catch (error) {
      toast.error((error as Error).message || '保存配置失败')
      return false
    } finally {
      setIsSavingConfig(false)
    }
  }, [config])

  // 列出远程备份
  const loadBackups = useCallback(async () => {
    setIsLoadingBackups(true)
    try {
      const response = await listWebDAVBackupsApi()
      const data = (response.data as { data: RemoteBackupInfo[] }).data
      setBackupList(data)
      return data
    } catch (error) {
      toast.error((error as Error).message || '获取远程备份列表失败')
      return []
    } finally {
      setIsLoadingBackups(false)
    }
  }, [])

  // 上传备份（任务模式 + 轮询进度）
  const uploadBackup = useCallback(async () => {
    setIsUploading(true)
    setUploadProgress(null)
    try {
      // 启动上传任务
      const response = await startUploadWebDAVBackupApi()
      const data = response.data as { data: { taskId: string } }
      const taskId = data.data.taskId

      // 轮询进度直到完成
      let finished = false
      while (!finished) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
        const progressResponse = await getUploadWebDAVProgressApi(taskId)
        const progress = (progressResponse.data as { data: WebDAVTaskProgress }).data
        setUploadProgress(progress)
        if (progress.status === 'success') {
          toast.success(progress.message || '上传成功')
          void loadBackups()
          finished = true
        } else if (progress.status === 'error') {
          toast.error(progress.error || progress.message || '上传失败')
          finished = true
        }
      }
      return true
    } catch (error) {
      toast.error((error as Error).message || '上传失败')
      return false
    } finally {
      setIsUploading(false)
    }
  }, [loadBackups])

  // 下载备份
  const downloadBackup = useCallback(async () => {
    if (!selectedBackup) {
      toast.error('请先选择要下载的备份')
      return false
    }
    setIsDownloading(true)
    try {
      const response = await downloadWebDAVBackupApi(selectedBackup)
      const data = response.data as { data: { success: boolean; message: string } }
      toast.success(data.data.message || '下载成功')
      return true
    } catch (error) {
      toast.error((error as Error).message || '下载失败')
      return false
    } finally {
      setIsDownloading(false)
    }
  }, [selectedBackup])

  return {
    config,
    updateConfig,
    isLoadingConfig,
    isTestingConnection,
    isSavingConfig,
    testConnection,
    saveConfig,
    isUploading,
    uploadProgress,
    uploadBackup,
    backupList,
    isLoadingBackups,
    loadBackups,
    selectedBackup,
    setSelectedBackup,
    downloadConfirmOpen,
    setDownloadConfirmOpen,
    isDownloading,
    downloadBackup,
  }
}
