'use client'

import { useAppSettingsEditor } from '../hooks/use-app-settings-editor'
import { AppBrandingSection } from './app-branding-section'
import { AppPortSection } from './app-port-section'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function GeneralSettings() {
  const editor = useAppSettingsEditor()
  const { query, savedSettings } = editor

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-52 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  if (query.isLoadingError) {
    return (
      <section className="dark:border-input dark:bg-input/20 flex flex-wrap items-center justify-between gap-4 rounded-xl border p-6">
        <p className="text-destructive text-sm">读取通用设置失败</p>
        <Button type="button" variant="outline" onClick={() => void query.refetch()}>
          重试
        </Button>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <AppBrandingSection
        nameInput={editor.nameInput}
        savedName={savedSettings.name}
        iconPath={savedSettings.iconPath}
        fileInputRef={editor.fileInputRef}
        hasNameChanges={editor.hasNameChanges}
        hasCustomName={editor.hasCustomName}
        isBusy={editor.isBusy}
        isSavingName={editor.isSavingName}
        isUploadingIcon={editor.isUploadingIcon}
        isResettingIcon={editor.isResettingIcon}
        onNameChange={editor.setNameDraft}
        onSaveName={editor.handleSaveName}
        onResetName={editor.handleResetName}
        onPickIcon={editor.handlePickIcon}
        onIconFileChange={editor.handleIconFileChange}
        onResetIcon={editor.handleResetIcon}
      />

      <AppPortSection
        portInput={editor.portInput}
        savedPort={savedSettings.port}
        runtimePort={editor.runtimePort}
        canRestartServer={editor.canRestartServer}
        hasPortChanges={editor.hasPortChanges}
        hasCustomPort={editor.hasCustomPort}
        isBusy={editor.isBusy}
        isSavingPort={editor.isSavingPort}
        isRestarting={editor.isRestarting}
        onPortChange={editor.setPortDraft}
        onSavePort={editor.handleSavePort}
        onResetPort={editor.handleResetPort}
        onRestartServer={editor.handleRestartServer}
      />
    </div>
  )
}
