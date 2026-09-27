'use client'

import { WebDAVConfigCard } from '@/features/backup/components/webdav-config-card'
import { WebDAVDownloadCard } from '@/features/backup/components/webdav-download-card'
import { WebDAVUploadCard } from '@/features/backup/components/webdav-upload-card'
import { useWebDAVBackup } from '@/features/backup/hooks/use-webdav-backup'

export function WebDAVBackupPanel() {
  const {
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
  } = useWebDAVBackup()

  if (isLoadingConfig) {
    return (
      <div className="dark:border-input dark:bg-input/20 text-muted-foreground rounded-xl border p-6 text-center text-sm">
        加载 WebDAV 配置中...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <WebDAVConfigCard
        config={config}
        updateConfig={updateConfig}
        isTestingConnection={isTestingConnection}
        isSavingConfig={isSavingConfig}
        testConnection={testConnection}
        saveConfig={saveConfig}
      />
      <WebDAVUploadCard
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadBackup={uploadBackup}
      />
      <WebDAVDownloadCard
        backupList={backupList}
        isLoadingBackups={isLoadingBackups}
        loadBackups={loadBackups}
        selectedBackup={selectedBackup}
        setSelectedBackup={setSelectedBackup}
        downloadConfirmOpen={downloadConfirmOpen}
        setDownloadConfirmOpen={setDownloadConfirmOpen}
        isDownloading={isDownloading}
        downloadBackup={downloadBackup}
      />
    </div>
  )
}
