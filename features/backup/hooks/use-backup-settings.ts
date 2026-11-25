'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  getBackupContentConfigApi,
  updateBackupContentConfigApi,
} from '@/features/backup/sync-server-api'
import { selectDirectory } from '@/features/game/lib/scan-utils'
import { DEFAULT_BACKUP_CONTENT_OPTIONS } from '@/lib/backup-content'
import { api } from '@/lib/request-utils'
import { saveExport } from '@/lib/save-export'

import type { BackupContentOptions } from '@/types'

export type LocalBackup = {
  id: string
  name: string
  size: number
  createdAt: string
}

export type GameSaveConfig = {
  enabled: boolean
  directory: string
}

export function useBackupSettings() {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingXlsx, setIsExportingXlsx] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const [gameSaveEnabled, setGameSaveEnabled] = useState(false)
  const [gameSaveDir, setGameSaveDir] = useState('')
  const [isSavingGameSave, setIsSavingGameSave] = useState(false)

  const { data: localBackups = [], isLoading: isLoadingBackups } = useQuery({
    queryKey: ['local-backups'],
    queryFn: async () => {
      const response = await api.get('/settings/backup/local')
      return (response.data as { data: LocalBackup[] }).data
    },
  })

  useQuery({
    queryKey: ['game-save-config'],
    queryFn: async () => {
      const response = await api.get('/settings/game-save')
      const config = (response.data as { data: GameSaveConfig }).data
      setGameSaveEnabled(config.enabled)
      setGameSaveDir(config.directory)
      return config
    },
  })

  const {
    data: backupContent = DEFAULT_BACKUP_CONTENT_OPTIONS,
    isLoading: isLoadingBackupContent,
  } = useQuery({
    queryKey: ['backup-content-config'],
    queryFn: async () => {
      const response = await getBackupContentConfigApi()
      return response.data.data
    },
  })

  const updateBackupContent = async (next: BackupContentOptions) => {
    const previous =
      queryClient.getQueryData<BackupContentOptions>(['backup-content-config']) ?? backupContent
    queryClient.setQueryData(['backup-content-config'], next)
    try {
      const response = await updateBackupContentConfigApi(next)
      queryClient.setQueryData(['backup-content-config'], response.data.data)
    } catch (error) {
      queryClient.setQueryData(['backup-content-config'], previous)
      toast.error((error as Error).message || '保存备份内容配置失败')
    }
  }

  const resolveExportFileName = (headers: Record<string, string>, fallbackFileName: string) => {
    const disposition = headers['content-disposition'] || headers['Content-Disposition']
    let fileName = fallbackFileName
    if (disposition) {
      const match = disposition.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)
      if (match?.[1]) fileName = decodeURIComponent(match[1].replace(/"/g, ''))
    }
    return fileName
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await api.post('/settings/backup/export', null, { responseType: 'blob' })
      const fileName = resolveExportFileName(
        response.headers as Record<string, string>,
        'vnweb-backup.zip',
      )
      const saved = await saveExport(response.data, fileName)
      if (saved) toast.success('备份导出成功', { description: saved.path })
    } catch (error) {
      toast.error(typeof error === 'string' ? error : (error as Error).message || '导出备份失败')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportXlsx = async () => {
    setIsExportingXlsx(true)
    try {
      const response = await api.post('/settings/backup/export-xlsx', null, {
        responseType: 'blob',
      })
      const fileName = resolveExportFileName(
        response.headers as Record<string, string>,
        'vnweb-timer-records.xlsx',
      )
      const saved = await saveExport(response.data, fileName)
      if (saved) toast.success('计时记录导出成功', { description: saved.path })
    } catch (error) {
      toast.error(typeof error === 'string' ? error : (error as Error).message || '导出 xlsx 失败')
    } finally {
      setIsExportingXlsx(false)
    }
  }

  const handleImportFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    setIsImporting(true)
    try {
      await api.post('/settings/backup/import', formData)
      toast.success('备份导入成功，页面将重新加载')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      toast.error((error as Error).message || '导入备份失败')
    } finally {
      setIsImporting(false)
      input.value = ''
    }
  }

  const handleCreateLocalBackup = async () => {
    setIsCreatingBackup(true)
    try {
      await api.post('/settings/backup/local')
      await queryClient.invalidateQueries({ queryKey: ['local-backups'] })
      toast.success('本地备份创建成功')
    } catch (error) {
      toast.error((error as Error).message || '创建备份失败')
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const handleRestoreBackup = async () => {
    if (!restoreTargetId) return
    try {
      await api.post(`/settings/backup/local/restore?id=${encodeURIComponent(restoreTargetId)}`)
      toast.success('备份恢复成功，页面将重新加载')
      setTimeout(() => window.location.reload(), 1500)
    } catch (error) {
      toast.error((error as Error).message || '恢复备份失败')
    } finally {
      setRestoreTargetId(null)
    }
  }

  const handleDeleteBackup = async () => {
    if (!deleteTargetId) return
    try {
      await api.delete(`/settings/backup/local?id=${encodeURIComponent(deleteTargetId)}`)
      await queryClient.invalidateQueries({ queryKey: ['local-backups'] })
      toast.success('备份已删除')
    } catch (error) {
      toast.error((error as Error).message || '删除备份失败')
    } finally {
      setDeleteTargetId(null)
    }
  }

  const handleSelectGameSaveDir = async () => {
    try {
      const directory = await selectDirectory()
      if (directory) setGameSaveDir(directory)
    } catch {
      toast.error('选择目录失败')
    }
  }

  const handleSaveGameSaveConfig = async () => {
    setIsSavingGameSave(true)
    try {
      await api.post('/settings/game-save', {
        enabled: gameSaveEnabled,
        directory: gameSaveDir,
      })
      await queryClient.invalidateQueries({ queryKey: ['game-save-config'] })
      toast.success('游戏存档配置已保存')
    } catch (error) {
      toast.error((error as Error).message || '保存配置失败')
    } finally {
      setIsSavingGameSave(false)
    }
  }

  return {
    isExporting,
    isExportingXlsx,
    isImporting,
    isCreatingBackup,
    restoreTargetId,
    setRestoreTargetId,
    deleteTargetId,
    setDeleteTargetId,
    importFileInputRef,
    gameSaveEnabled,
    setGameSaveEnabled,
    gameSaveDir,
    setGameSaveDir,
    isSavingGameSave,
    backupContent,
    isLoadingBackupContent,
    updateBackupContent,
    localBackups,
    isLoadingBackups,
    handleExport,
    handleExportXlsx,
    handleImportFileChange,
    handleCreateLocalBackup,
    handleRestoreBackup,
    handleDeleteBackup,
    handleSelectGameSaveDir,
    handleSaveGameSaveConfig,
  }
}
