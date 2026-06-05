'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/request-utils'

export default function BackupSettingsContent() {
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingXlsx, setIsExportingXlsx] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)

  const downloadBlobFile = (
    blob: Blob,
    headers: Record<string, string>,
    fallbackFileName: string,
  ) => {
    const contentDisposition = headers['content-disposition'] || headers['Content-Disposition']
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

      downloadBlobFile(response.data, response.headers as Record<string, string>, 'vnweb-backup.zip')
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

      downloadBlobFile(response.data, response.headers as Record<string, string>, 'vnweb-timer-records.xlsx')
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
      // 延迟刷新页面
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

  return (
    <div className="space-y-6">
      <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
        <div>
          <p className="text-base font-semibold">数据备份</p>
          <p className="text-muted-foreground mt-1 text-sm">
            导出或导入您的游戏数据库和本地资源文件。
          </p>
        </div>

        {/* 导出功能 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导出备份</p>
              <p className="text-muted-foreground text-xs">
                将数据库和本地图片、音频、视频等资源打包下载。
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isExportingXlsx}
                onClick={handleExportXlsx}
              >
                {isExportingXlsx ? '导出中...' : '导出 XLSX'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isExporting}
                onClick={handleExport}
              >
                {isExporting ? '导出中...' : '导出 ZIP'}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            XLSX
            将导出每条计时记录：序号、封面、游戏名称、游戏原名、开始时间、结束时间、本次游戏时长。
          </p>
        </div>

        {/* 导入功能 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">导入备份</p>
              <p className="text-muted-foreground text-xs">
                从备份文件还原数据库和资源文件。导入前会自动备份当前数据。
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

        {/* 提示信息 */}
        {/* <div className="rounded-md border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            <strong>注意事项：</strong>
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-yellow-600/80 dark:text-yellow-400/80">
            <li>导入备份会替换当前的数据库和所有本地资源文件</li>
            <li>导入前会自动创建当前数据的备份（.bak 后缀）</li>
            <li>如果导入失败，可以使用备份文件恢复</li>
            <li>建议在导入前关闭应用程序</li>
          </ul>
        </div> */}
      </div>
    </div>
  )
}
