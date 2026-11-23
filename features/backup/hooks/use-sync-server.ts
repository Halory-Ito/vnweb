'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  createSyncConfigApi,
  deleteSyncConfigApi,
  downloadSyncBackupApi,
  getSyncConfigsApi,
  getUploadSyncProgressApi,
  listSyncBackupsApi,
  startUploadSyncBackupApi,
  testSyncConnectionApi,
  updateSyncConfigApi,
  type RemoteBackupInfo,
  type SyncConnectionPayload,
  type SyncTaskProgress,
} from '@/features/backup/sync-server-api'

import type { SyncServerConfig } from '@/types'

export const createEmptySyncConfig = (): SyncServerConfig => ({
  id: '',
  name: '',
  provider: 'webdav',
  server: '',
  username: '',
  password: '',
  remotePath: '/vnweb-backup',
  endpoint: '',
  bucket: '',
  region: 'us-east-1',
  accessKeyId: '',
  secretAccessKey: '',
  forcePathStyle: true,
  enabled: false,
})

const POLL_INTERVAL = 800

export function useSyncServer() {
  const [configs, setConfigs] = useState<SyncServerConfig[]>([])
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<SyncTaskProgress | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [backupList, setBackupList] = useState<RemoteBackupInfo[]>([])
  const [isLoadingBackups, setIsLoadingBackups] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [downloadConfirmOpen, setDownloadConfirmOpen] = useState(false)
  const hasLoadedRef = useRef(false)

  const activeConfig = configs.find((item) => item.enabled) ?? null

  const loadConfigs = useCallback(async () => {
    setIsLoadingConfigs(true)
    try {
      const response = await getSyncConfigsApi()
      const data = (response.data as { data: { configs: SyncServerConfig[] } }).data
      setConfigs(data.configs ?? [])
    } catch (error) {
      toast.error((error as Error).message || '加载配置失败')
    } finally {
      setIsLoadingConfigs(false)
    }
  }, [])

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    void loadConfigs()
  }, [loadConfigs])

  const testConnection = useCallback(async (draft: SyncServerConfig) => {
    if (draft.provider === 's3' ? !draft.endpoint || !draft.bucket : !draft.server) {
      toast.error(draft.provider === 's3' ? '请先填写 S3 服务地址与存储桶' : '请先填写服务器地址')
      return false
    }
    setTestingId(draft.id || 'new')
    try {
      const payload: SyncConnectionPayload = draft
      const response = await testSyncConnectionApi(payload)
      const data = response.data as { data: { message: string } }
      toast.success(data.data.message || '连接成功')
      return true
    } catch (error) {
      toast.error((error as Error).message || '连接失败')
      return false
    } finally {
      setTestingId(null)
    }
  }, [])

  const saveConfig = useCallback(
    async (draft: SyncServerConfig) => {
      const invalid =
        draft.provider === 's3'
          ? !draft.name || !draft.endpoint || !draft.bucket || !draft.accessKeyId
          : !draft.name || !draft.server
      if (invalid) {
        toast.error(draft.provider === 's3' ? '请填写名称与 S3 必填项' : '请填写名称与服务器地址')
        return false
      }
      setSavingId(draft.id || 'new')
      try {
        if (draft.id) {
          await updateSyncConfigApi(draft)
        } else {
          const { id: _id, ...payload } = draft
          void _id
          await createSyncConfigApi(payload)
        }
        toast.success('配置已保存')
        await loadConfigs()
        return true
      } catch (error) {
        toast.error((error as Error).message || '保存配置失败')
        return false
      } finally {
        setSavingId(null)
      }
    },
    [loadConfigs],
  )

  const deleteConfig = useCallback(
    async (id: string) => {
      try {
        await deleteSyncConfigApi(id)
        toast.success('配置已删除')
        await loadConfigs()
      } catch (error) {
        toast.error((error as Error).message || '删除配置失败')
      }
    },
    [loadConfigs],
  )

  const loadBackups = useCallback(async () => {
    setIsLoadingBackups(true)
    try {
      const response = await listSyncBackupsApi()
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

  const uploadBackup = useCallback(async () => {
    setIsUploading(true)
    setUploadProgress(null)
    try {
      const response = await startUploadSyncBackupApi()
      const { taskId } = (response.data as { data: { taskId: string } }).data

      let finished = false
      while (!finished) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
        const progressResponse = await getUploadSyncProgressApi(taskId)
        const progress = (progressResponse.data as { data: SyncTaskProgress }).data
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

  const downloadBackup = useCallback(async () => {
    if (!selectedBackup) {
      toast.error('请先选择要下载的备份')
      return false
    }
    setIsDownloading(true)
    try {
      const response = await downloadSyncBackupApi(selectedBackup)
      const data = response.data as { data: { message: string } }
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
    configs,
    activeConfig,
    isLoadingConfigs,
    testingId,
    savingId,
    testConnection,
    saveConfig,
    deleteConfig,
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
