'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, Loader2, Play, Square, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getNeteaseSdkStatusApi,
  runNeteaseSdkActionApi,
  type NeteaseSdkAction,
} from '@/lib/settings/platform-settings'

const ACTION_SUCCESS_TEXT: Record<NeteaseSdkAction, string> = {
  install: 'SDK 安装成功',
  start: '服务已启动，接口地址已自动更新',
  stop: '服务已停止',
  uninstall: 'SDK 已卸载',
}

export function NeteaseSdkControls({ savedPort }: { savedPort: number }) {
  const portInputId = useId()
  const queryClient = useQueryClient()
  const [portInput, setPortInput] = useState<string>()

  const { data: status, isLoading } = useQuery({
    queryKey: ['netease-sdk-status'],
    queryFn: getNeteaseSdkStatusApi,
  })

  const displayedPort = portInput ?? String(status?.running ? status.port : savedPort)

  const actionMutation = useMutation({
    mutationFn: runNeteaseSdkActionApi,
    onSuccess: (nextStatus, variables) => {
      queryClient.setQueryData(['netease-sdk-status'], nextStatus)
      if (variables.action === 'start') {
        setPortInput(undefined)
        void queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      }
      toast.success(ACTION_SUCCESS_TEXT[variables.action])
    },
    onError: (error) => {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '操作失败')
    },
  })

  const activeAction = actionMutation.isPending ? actionMutation.variables?.action : null
  const isBusy = isLoading || actionMutation.isPending

  const handleStart = () => {
    const port = Number(displayedPort)
    if (!Number.isInteger(port) || port < 1024 || port > 65535) {
      toast.error('端口必须是 1024 至 65535 之间的整数')
      return
    }
    actionMutation.mutate({
      action: 'start',
      port,
    })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor={portInputId} className="text-sm font-medium">
          本地 SDK
        </Label>
        {status?.running ? (
          <Badge variant="default">运行中 :{status.port}</Badge>
        ) : status?.installed ? (
          <Badge variant="outline">已安装{status.version ? ` v${status.version}` : ''}</Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            未安装
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!status?.installed ? (
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => actionMutation.mutate({ action: 'install' })}
          >
            {activeAction === 'install' ? <Loader2 className="animate-spin" /> : <Download />}
            {activeAction === 'install' ? '安装中...' : '安装 SDK'}
          </Button>
        ) : (
          <>
            <Input
              id={portInputId}
              type="number"
              min={1024}
              max={65535}
              value={displayedPort}
              onChange={(event) => setPortInput(event.target.value)}
              disabled={isBusy || status.running}
              placeholder="端口"
              className="w-24"
            />
            {status.running ? (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => actionMutation.mutate({ action: 'stop' })}
              >
                {activeAction === 'stop' ? <Loader2 className="animate-spin" /> : <Square />}
                停止
              </Button>
            ) : (
              <Button type="button" variant="outline" disabled={isBusy} onClick={handleStart}>
                {activeAction === 'start' ? <Loader2 className="animate-spin" /> : <Play />}
                {activeAction === 'start' ? '启动中...' : '启动'}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              disabled={isBusy}
              onClick={() => actionMutation.mutate({ action: 'uninstall' })}
            >
              {activeAction === 'uninstall' ? <Loader2 className="animate-spin" /> : <Trash2 />}
              卸载
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
