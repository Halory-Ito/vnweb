'use client'

import { Loader2Icon, WifiIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
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
import { Switch } from '@/components/ui/switch'
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editData ? '编辑服务器' : '新增服务器'}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
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
                <SelectTrigger id="sync-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webdav">WebDAV</SelectItem>
                  <SelectItem value="s3">S3 兼容存储</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {draft.provider === 'webdav' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="sync-server">服务器地址</Label>
                <Input
                  id="sync-server"
                  value={draft.server || ''}
                  onChange={(e) => update('server', e.target.value)}
                  placeholder="https://dav.example.com"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sync-username">用户名</Label>
                  <Input
                    id="sync-username"
                    value={draft.username || ''}
                    onChange={(e) => update('username', e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-password">密码</Label>
                  <Input
                    id="sync-password"
                    type="password"
                    value={draft.password || ''}
                    onChange={(e) => update('password', e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="sync-endpoint">服务地址（Endpoint）</Label>
                <Input
                  id="sync-endpoint"
                  value={draft.endpoint || ''}
                  onChange={(e) => update('endpoint', e.target.value)}
                  placeholder="https://s3.example.com"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sync-bucket">存储桶（Bucket）</Label>
                  <Input
                    id="sync-bucket"
                    value={draft.bucket || ''}
                    onChange={(e) => update('bucket', e.target.value)}
                    placeholder="vnweb-backup"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-region">区域（Region）</Label>
                  <Input
                    id="sync-region"
                    value={draft.region || ''}
                    onChange={(e) => update('region', e.target.value)}
                    placeholder="us-east-1"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sync-access-key">Access Key ID</Label>
                  <Input
                    id="sync-access-key"
                    value={draft.accessKeyId || ''}
                    onChange={(e) => update('accessKeyId', e.target.value)}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-secret-key">Secret Access Key</Label>
                  <Input
                    id="sync-secret-key"
                    type="password"
                    value={draft.secretAccessKey || ''}
                    onChange={(e) => update('secretAccessKey', e.target.value)}
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex min-h-8 items-center justify-between gap-3">
                <Label htmlFor="sync-path-style">路径样式（Path Style）</Label>
                <Switch
                  id="sync-path-style"
                  checked={draft.forcePathStyle ?? true}
                  onCheckedChange={(v) => update('forcePathStyle', v)}
                />
              </div>
            </>
          )}

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

        <DialogFooter>
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
          <Button type="button" disabled={busy} onClick={() => void handleSave()}>
            {savingId !== null ? <Loader2Icon className="size-4 animate-spin" /> : null}
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
