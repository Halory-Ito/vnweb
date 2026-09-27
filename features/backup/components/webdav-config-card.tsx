'use client'

import { Loader2Icon, SaveIcon, WifiIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { WebDAVConfigState } from '@/features/backup/hooks/use-webdav-backup'

type Props = {
  config: WebDAVConfigState
  updateConfig: (key: keyof WebDAVConfigState, value: string) => void
  isTestingConnection: boolean
  isSavingConfig: boolean
  testConnection: () => Promise<boolean>
  saveConfig: () => Promise<boolean>
}

export function WebDAVConfigCard({
  config,
  updateConfig,
  isTestingConnection,
  isSavingConfig,
  testConnection,
  saveConfig,
}: Props) {
  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">WebDAV 服务器</p>
        <p className="text-muted-foreground mt-1 text-sm">
          配置 WebDAV 服务器，用于将 public 目录、assets 目录和 local.db 数据库备份到远程服务器。
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>服务器地址</Label>
          <Input
            value={config.server}
            onChange={(e) => updateConfig('server', e.target.value)}
            placeholder="https://dav.example.com"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>用户名</Label>
            <Input
              value={config.username}
              onChange={(e) => updateConfig('username', e.target.value)}
              placeholder="用户名"
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label>密码</Label>
            <Input
              type="password"
              value={config.password}
              onChange={(e) => updateConfig('password', e.target.value)}
              placeholder="密码"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>远程备份目录</Label>
          <Input
            value={config.remotePath}
            onChange={(e) => updateConfig('remotePath', e.target.value)}
            placeholder="/vnweb-backup"
          />
          <p className="text-muted-foreground text-xs">
            备份文件将上传到该目录下，每次上传生成一个带时间戳的备份文件夹。
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={isTestingConnection || isSavingConfig}
          onClick={() => void testConnection()}
        >
          {isTestingConnection ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <WifiIcon className="size-4" />
          )}
          {isTestingConnection ? '测试中...' : '测试连接'}
        </Button>
        <Button
          type="button"
          disabled={isTestingConnection || isSavingConfig}
          onClick={() => void saveConfig()}
        >
          {isSavingConfig ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <SaveIcon className="size-4" />
          )}
          {isSavingConfig ? '保存中...' : '保存配置'}
        </Button>
      </div>
    </div>
  )
}
