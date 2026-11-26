'use client'

import { FolderOpen, Upload } from 'lucide-react'
import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { usePlatformImport } from '../../hooks/use-platform-import'

export function PlatformImportSourceStep({
  state,
}: {
  state: ReturnType<typeof usePlatformImport>
}) {
  const pathInputId = useId()

  return (
    <Tabs
      value={state.inputMode}
      onValueChange={(value) => state.setInputMode(value as 'file' | 'directory')}
      className="space-y-4"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="file" disabled={state.isBusy}>
          上传导出/备份文件
        </TabsTrigger>
        <TabsTrigger value="directory" disabled={state.isBusy}>
          本地数据目录
        </TabsTrigger>
      </TabsList>

      <TabsContent value="file" className="space-y-3">
        <input
          ref={state.fileInputRef}
          type="file"
          accept={state.sourceMeta.accept}
          className="hidden"
          onChange={(event) => {
            state.handleFileChange(event.target.files?.[0] ?? null)
            event.currentTarget.value = ''
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            readOnly
            value={state.selectedFile ? state.selectedFile.name : ''}
            placeholder={`支持 ${state.sourceMeta.accept}`}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            variant="outline"
            disabled={state.isBusy}
            onClick={() => state.fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Upload className="size-4" />
            选择文件
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="directory" className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={pathInputId}>数据目录路径</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id={pathInputId}
              value={state.localPath}
              onChange={(event) => state.setLocalPath(event.target.value)}
              placeholder={state.sourceMeta.placeholderPath}
              disabled={state.isBusy}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="outline"
              disabled={state.isBusy}
              onClick={() => void state.handleSelectDirectory()}
              className="shrink-0"
            >
              <FolderOpen className="size-4" />
              选择目录
            </Button>
          </div>
        </div>

        {state.detectedPath ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{state.detectedPath.path}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={state.isBusy}
              onClick={state.handleApplyDetectedPath}
            >
              使用检测路径
            </Button>
          </div>
        ) : null}
      </TabsContent>
    </Tabs>
  )
}
