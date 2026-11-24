'use client'

import { Loader2Icon, WifiIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { SyncConfigProviderFields } from './sync-config-provider-fields'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createEmptySyncConfig } from '@/features/backup/hooks/use-sync-server'

import type { SyncProvider, SyncServerConfig } from '@/types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData: SyncServerConfig | null
  testingId: string | null
  savingId: string | null
  onTest: (draft: SyncServerConfig) => Promise<boolean>
  onSave: (draft: SyncServerConfig) => Promise<boolean>
}

export function SyncConfigDialog({
  open,
  onOpenChange,
  editData,
  testingId,
  savingId,
  onTest,
  onSave,
}: Props) {
  const [draft, setDraft] = useState<SyncServerConfig>(createEmptySyncConfig())

  useEffect(() => {
    if (open) {
      setDraft(editData ? { ...createEmptySyncConfig(), ...editData } : createEmptySyncConfig())
    }
  }, [open, editData])

  const update = (key: keyof SyncServerConfig, value: string | boolean) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const changeProvider = (provider: SyncProvider) => {
    setDraft((prev) => ({ ...prev, provider }))
  }

  const busy = testingId !== null || savingId !== null

  const handleSave = async () => {
    const success = await onSave(draft)
    if (success) onOpenChange(false)
  }

  const canTest =
    draft.provider === 's3' ? Boolean(draft.endpoint && draft.bucket) : Boolean(draft.server)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85dvh] w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden sm:max-w-md">
        <DialogHeader className="shrink-0">
          <DialogTitle>{editData ? '编辑服务器' : '新增服务器'}</DialogTitle>
          <DialogDescription className="sr-only">配置同步服务器连接参数</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sync-name">名称</Label>
              <Input
                id="sync-name"
                value={draft.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="我的服务器"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sync-provider">类型</Label>
              <Select
                value={draft.provider}
                onValueChange={(v) => changeProvider(v as SyncProvider)}
              >
                <SelectTrigger id="sync-provider" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webdav">WebDAV</SelectItem>
                  <SelectItem value="s3">S3 兼容存储</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SyncConfigProviderFields draft={draft} onUpdate={update} />

          <div className="space-y-2">
            <Label htmlFor="sync-path">远程备份目录</Label>
            <Input
              id="sync-path"
              value={draft.remotePath}
              onChange={(e) => update('remotePath', e.target.value)}
              placeholder="/vnweb-backup"
            />
          </div>
        </div>

        <DialogFooter className="shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={busy || !canTest}
            onClick={() => void onTest(draft)}
          >
            {testingId !== null ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <WifiIcon className="size-4" />
            )}
            测试连接
          </Button>
          <Button type="button" variant="outline" disabled={busy} onClick={() => void handleSave()}>
            {savingId !== null ? <Loader2Icon className="size-4 animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
