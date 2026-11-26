'use client'

import { useId } from 'react'

import { PLATFORM_IMPORT_SOURCES } from '../../data/platform-import-sources'
import { usePlatformImport } from '../../hooks/use-platform-import'
import { PlatformImportPreviewStep } from './platform-import-preview-step'
import { PlatformImportSourceStep } from './platform-import-source-step'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { ExternalImportPlatform } from '@/types/platform-import'
import type { ReactNode } from 'react'

type PlatformImportDialogProps = {
  children: ReactNode
  initialPlatform?: ExternalImportPlatform
  lockPlatform?: boolean
}

export function PlatformImportDialog({
  children,
  initialPlatform = 'playnite',
  lockPlatform = false,
}: PlatformImportDialogProps) {
  const selectId = useId()
  const state = usePlatformImport({ initialPlatform, lockPlatform })

  return (
    <Dialog open={state.open} onOpenChange={state.handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col gap-4 overflow-hidden p-5 sm:max-w-2xl sm:p-7 lg:max-w-3xl xl:max-w-4xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {lockPlatform || state.preview ? (
              <>
                <img
                  src={state.sourceMeta.logo}
                  alt={state.sourceMeta.label}
                  className="size-5 shrink-0 rounded-xs object-contain"
                />
                <span>{`从 ${state.sourceMeta.label} 导入数据`}</span>
              </>
            ) : (
              '从其他平台导入数据'
            )}
          </DialogTitle>
        </DialogHeader>

        {!lockPlatform && !state.preview ? (
          <div className="shrink-0 space-y-2">
            <Label htmlFor={selectId}>来源平台</Label>
            <Select
              value={state.platform}
              disabled={state.isBusy}
              onValueChange={(value) => state.handlePlatformChange(value as ExternalImportPlatform)}
            >
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PLATFORM_IMPORT_SOURCES.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    <span className="flex items-center gap-2">
                      <img
                        src={source.logo}
                        alt={source.label}
                        className="size-4 shrink-0 rounded-xs object-contain"
                      />
                      <span>{source.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 py-1">
          {state.preview ? (
            <PlatformImportPreviewStep state={state} />
          ) : (
            <PlatformImportSourceStep state={state} />
          )}
        </div>

        <DialogFooter className="shrink-0">
          {state.preview ? (
            <Button
              type="button"
              variant="outline"
              disabled={state.isBusy}
              onClick={state.handleResetToSource}
            >
              重新选择数据源
            </Button>
          ) : null}
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={state.isBusy}>
              {state.executeResult ? '关闭' : '取消'}
            </Button>
          </DialogClose>
          {!state.preview ? (
            <Button type="button" disabled={state.isBusy} onClick={state.handleParse}>
              {state.isParsing ? '解析中...' : '解析数据'}
            </Button>
          ) : !state.executeResult ? (
            <Button
              type="button"
              disabled={state.isBusy || state.selectableSelectedCount === 0}
              onClick={state.handleExecute}
            >
              {state.isImporting ? '导入中...' : `开始导入（${state.selectableSelectedCount}）`}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
