'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import type { SyncServerConfig } from '@/types'

type Props = {
  draft: SyncServerConfig
  onUpdate: (key: keyof SyncServerConfig, value: string | boolean) => void
}

export function SyncConfigProviderFields({ draft, onUpdate }: Props) {
  if (draft.provider === 'webdav') {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="sync-server">服务器地址</Label>
          <Input
            id="sync-server"
            value={draft.server || ''}
            onChange={(e) => onUpdate('server', e.target.value)}
            placeholder="https://dav.example.com"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sync-username">用户名</Label>
            <Input
              id="sync-username"
              value={draft.username || ''}
              onChange={(e) => onUpdate('username', e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sync-password">密码</Label>
            <Input
              id="sync-password"
              type="password"
              value={draft.password || ''}
              onChange={(e) => onUpdate('password', e.target.value)}
              autoComplete="current-password"
            />
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="sync-endpoint">服务地址（Endpoint）</Label>
        <Input
          id="sync-endpoint"
          value={draft.endpoint || ''}
          onChange={(e) => onUpdate('endpoint', e.target.value)}
          placeholder="https://s3.example.com"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sync-bucket">存储桶（Bucket）</Label>
          <Input
            id="sync-bucket"
            value={draft.bucket || ''}
            onChange={(e) => onUpdate('bucket', e.target.value)}
            placeholder="vnweb-backup"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sync-region">区域（Region）</Label>
          <Input
            id="sync-region"
            value={draft.region || ''}
            onChange={(e) => onUpdate('region', e.target.value)}
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
            onChange={(e) => onUpdate('accessKeyId', e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sync-secret-key">Secret Access Key</Label>
          <Input
            id="sync-secret-key"
            type="password"
            value={draft.secretAccessKey || ''}
            onChange={(e) => onUpdate('secretAccessKey', e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label htmlFor="sync-path-style">路径样式（Path Style）</Label>
        <Switch
          id="sync-path-style"
          checked={draft.forcePathStyle ?? true}
          onCheckedChange={(v) => onUpdate('forcePathStyle', v)}
        />
      </div>
    </>
  )
}
