'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderOpenIcon, Trash2Icon } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { selectDirectory } from '@/lib/game/scan-utils'
import { api } from '@/lib/request-utils'

type LocalBackup = {
  id: string
  name: string
  size: number
  createdAt: string
}

type GameSaveConfig = {
  enabled: boolean
  directory: string
}

// 格式化文件大小
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export default function BackupSettingsContent() {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingXlsx, setIsExportingXlsx] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  // 游戏存档配置
  const [gameSaveEnabled, setGameSaveEnabled] = useState(false)
  const [gameSaveDir, setGameSaveDir] = useState('')
  const [isSavingGameSave, setIsSavingGameSave] = useState(false)

  // 获取本地备份列表
  const { data: localBackups = [], isLoading: isLoadingBackups } = useQuery({
    queryKey: ['local-backups'],
    queryFn: async () => {
      const response = await api.get('/settings/backup/local')
      return (response.data as { data: LocalBackup[] }).data
    },
  })

  // 获取游戏存档配置
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

  const downloadBlobFile = (
    blob: Blob,
    headers: Record<string, string>,
    fallbackFileName: string,
  ) => {
    const contentDisposition =
      headers['content-disposition'] || headers['Content-Disposition']
    let fileName = fallbackFileName
    if (contentDisposition) {
      const match = contentDisposition.match(
        /filename\*?=(?:UTF-8''|"?)([^";]+)/i,
      )
      if (match?.[1]) {
        fileName = decodeURIComponent(match[1].replace(/"/g, ''))
      }
    }

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await api.post('/settings/backup/export', null, {
        responseType: 'blob',
      })

      downloadBlobFile(
        response.data,
        response.headers as Record<string, string>,
        'vnweb-backup.zip',
      )
      toast.success('备份导出成功')
    } catch (error) {
      toast.error((error as Error).message || '导出备份失败')
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

      downloadBlobFile(
        response.data,
        response.headers as Record<string, string>,
        'vnweb-timer-records.xlsx',
      )
      toast.success('计时记录导出成功')
    } catch (error) {
      toast.error((error as Error).message || '导出 xlsx 失败')
    } finally {
      setIsExportingXlsx(false)
    }
  }

  const handleImportClick = () => {
    importFileInputRef.current?.click()
  }

  const handleImportFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setIsImporting(true)
    try {
      await api.post('/settings/backup/import', formData)

      toast.success('备份导入成功，页面将重新加载')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      toast.error((error as Error).message || '导入备份失败')
    } finally {
      setIsImporting(false)
      input.value = ''
    }
  }

  // 创建本地备份
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

  // 恢复本地备份
  const handleRestoreBackup = async () => {
    if (!restoreTargetId) return

    try {
      await api.post(
        `/settings/backup/local/restore?id=${encodeURIComponent(restoreTargetId)}`,
      )
      toast.success('备份恢复成功，页面将重新加载')
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      toast.error((error as Error).message || '恢复备份失败')
    } finally {
      setRestoreConfirmOpen(false)
      setRestoreTargetId(null)
    }
  }

  // 删除本地备份
  const handleDeleteBackup = async () => {
    if (!deleteTargetId) return

    try {
      await api.delete(
        `/settings/backup/local?id=${encodeURIComponent(deleteTargetId)}`,
      )
      await queryClient.invalidateQueries({ queryKey: ['local-backups'] })
      toast.success('备份已删除')
    } catch (error) {
      toast.error((error as Error).message || '删除备份失败')
    } finally {
      setDeleteConfirmOpen(false)
      setDeleteTargetId(null)
    }
  }

  // 选择游戏存档目录
  const handleSelectGameSaveDir = async () => {
    try {
      const directory = await selectDirectory()
      if (directory) {
        setGameSaveDir(directory)
      }
    } catch {
      toast.error('选择目录失败')
    }
  }

  // 保存游戏存档配置
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

  return (
    <div className="space-y-6">
      {/* 游戏存档设置 */}
      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">游戏存档</p>
          <p className="text-muted-foreground mt-1 text-sm">
            设置全局游戏存档目录，游戏结束时自动备份存档。
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">启用游戏存档备份</p>
            <p className="text-muted-foreground text-xs">
              游戏结束后自动复制存档到指定目录
            </p>
          </div>
          <Switch
            checked={gameSaveEnabled}
            onCheckedChange={setGameSaveEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label>存档目录</Label>
          <div className="flex gap-2">
            <Input
              value={gameSaveDir}
              onChange={(e) => setGameSaveDir(e.target.value)}
              placeholder="选择游戏存档的全局目录"
              disabled={!gameSaveEnabled}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => void handleSelectGameSaveDir()}
              disabled={!gameSaveEnabled}
            >
              <FolderOpenIcon className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            disabled={isSavingGameSave}
            onClick={() => void handleSaveGameSaveConfig()}
          >
            {isSavingGameSave ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </div>

      {/* 本地备份 */}
      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">本地备份</p>
          <p className="text-muted-foreground mt-1 text-sm">
            将数据库和资源文件备份到本地目录（Documents/VnBackups）。
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">创建备份</p>
            <p className="text-muted-foreground text-xs">
              立即创建一个本地备份
            </p>
          </div>
          <Button
            type="button"
            disabled={isCreatingBackup}
            onClick={() => void handleCreateLocalBackup()}
          >
            {isCreatingBackup ? '备份中...' : '立即备份'}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">备份列表</p>
          {isLoadingBackups ? (
            <p className="text-muted-foreground text-sm">加载中...</p>
          ) : localBackups.length === 0 ? (
            <p className="text-muted-foreground text-sm">暂无本地备份</p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {localBackups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {backup.name}
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span>
                        {backup.createdAt
                          ? new Date(backup.createdAt).toLocaleString()
                          : '未知时间'}
                      </span>
                      <span>·</span>
                      <span>{formatSize(backup.size)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setRestoreTargetId(backup.id)
                        setRestoreConfirmOpen(true)
                      }}
                    >
                      恢复
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeleteTargetId(backup.id)
                        setDeleteConfirmOpen(true)
                      }}
                    >
                      <Trash2Icon className="size-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 导出功能 */}
      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">导出备份</p>
          <p className="text-muted-foreground mt-1 text-sm">
            导出您的游戏数据库和本地资源文件。
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导出 ZIP</p>
              <p className="text-muted-foreground text-xs">
                将数据库和本地图片、音频、视频等资源打包下载。
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isExporting}
              onClick={() => void handleExport()}
            >
              {isExporting ? '导出中...' : '导出 ZIP'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导出 XLSX</p>
              <p className="text-muted-foreground text-xs">
                导出每条计时记录：序号、封面、游戏名称、游戏原名、开始时间、结束时间、本次游戏时长。
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={isExportingXlsx}
              onClick={() => void handleExportXlsx()}
            >
              {isExportingXlsx ? '导出中...' : '导出 XLSX'}
            </Button>
          </div>
        </div>
      </div>

      {/* 导入功能 */}
      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">导入备份</p>
          <p className="text-muted-foreground mt-1 text-sm">
            从备份文件还原数据库和资源文件。导入前会自动备份当前数据。
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">导入 ZIP</p>
            <p className="text-muted-foreground text-xs">
              上传 ZIP 格式的备份文件进行恢复。
            </p>
          </div>
          <div>
            <input
              ref={importFileInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(event) => {
                void handleImportFileChange(event)
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={isImporting}
              onClick={handleImportClick}
            >
              {isImporting ? '导入中...' : '导入'}
            </Button>
          </div>
        </div>
      </div>

      {/* 恢复确认对话框 */}
      <Dialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认恢复备份</DialogTitle>
            <DialogDescription>
              恢复备份将替换当前的数据库和资源文件。此操作不可撤销，确定要继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRestoreConfirmOpen(false)
                setRestoreTargetId(null)
              }}
            >
              取消
            </Button>
            <Button type="button" onClick={() => void handleRestoreBackup()}>
              确认恢复
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除备份</DialogTitle>
            <DialogDescription>
              删除后无法恢复，确定要删除这个备份吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false)
                setDeleteTargetId(null)
              }}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteBackup()}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
