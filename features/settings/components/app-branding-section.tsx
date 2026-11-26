'use client'

import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useId, type ChangeEvent, type RefObject } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ALLOWED_APP_ICON_EXTENSIONS,
  APP_NAME_MAX_LENGTH,
  resolveAppIconSrc,
} from '@/lib/settings/app-settings'

const ICON_ACCEPT = ['image/*', ...ALLOWED_APP_ICON_EXTENSIONS].join(',')

type AppBrandingSectionProps = {
  nameInput: string
  savedName: string
  iconPath: string
  fileInputRef: RefObject<HTMLInputElement | null>
  hasNameChanges: boolean
  hasCustomName: boolean
  isBusy: boolean
  isSavingName: boolean
  isUploadingIcon: boolean
  isResettingIcon: boolean
  onNameChange: (value: string) => void
  onSaveName: () => void
  onResetName: () => void
  onPickIcon: () => void
  onIconFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onResetIcon: () => void
}

export function AppBrandingSection({
  nameInput,
  savedName,
  iconPath,
  fileInputRef,
  hasNameChanges,
  hasCustomName,
  isBusy,
  isSavingName,
  isUploadingIcon,
  isResettingIcon,
  onNameChange,
  onSaveName,
  onResetName,
  onPickIcon,
  onIconFileChange,
  onResetIcon,
}: AppBrandingSectionProps) {
  const nameInputId = useId()
  const iconSrc = resolveAppIconSrc(iconPath)

  return (
    <section
      aria-labelledby="app-branding-settings-title"
      className="dark:border-input dark:bg-input/20 flex flex-col gap-4 rounded-xl border p-6"
    >
      <h2 id="app-branding-settings-title" className="text-base font-semibold">
        软件信息
      </h2>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="text-sm font-medium">软件图标</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={ICON_ACCEPT}
          hidden
          onChange={onIconFileChange}
        />
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="dark:border-input flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
            <Image
              src={iconSrc}
              alt={savedName}
              width={36}
              height={36}
              unoptimized
              className="size-full object-contain"
            />
          </div>
          <Button type="button" variant="outline" disabled={isBusy} onClick={onPickIcon}>
            {isUploadingIcon ? (
              <Loader2 className="animate-spin" />
            ) : iconPath ? (
              '更换图标'
            ) : (
              '选择图标'
            )}
          </Button>
          {iconPath ? (
            <Button type="button" variant="outline" disabled={isBusy} onClick={onResetIcon}>
              {isResettingIcon ? <Loader2 className="animate-spin" /> : '恢复默认'}
            </Button>
          ) : null}
        </div>
      </div>

      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (hasNameChanges && !isBusy) onSaveName()
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <Label htmlFor={nameInputId}>软件名称</Label>
          <Input
            id={nameInputId}
            type="text"
            value={nameInput}
            maxLength={APP_NAME_MAX_LENGTH}
            disabled={isBusy}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full sm:max-w-md"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          {hasCustomName ? (
            <Button type="button" variant="outline" disabled={isBusy} onClick={onResetName}>
              恢复默认
            </Button>
          ) : null}
          <Button type="submit" variant="outline" disabled={isBusy || !hasNameChanges}>
            {isSavingName ? <Loader2 className="animate-spin" /> : '保存名称'}
          </Button>
        </div>
      </form>
    </section>
  )
}
