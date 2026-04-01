'use client'

import { Copy, Edit, Globe, MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/request-utils'

import type { ProxyConfig } from './proxy-config-dialog'

interface ProxyConfigCardProps {
  config: ProxyConfig
  onEdit: (config: ProxyConfig) => void
  onDelete: (id: number) => void
  onToggle: (id: number, enabled: boolean) => void
}

export function ProxyConfigCard({
  config,
  onEdit,
  onDelete,
  onToggle,
}: ProxyConfigCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  const handleToggle = async (enabled: boolean) => {
    setIsToggling(true)
    try {
      const res = await api.request({
        method: 'PUT',
        url: '/settings/proxy',
        data: { ...config, enabled },
      })
      if (res.status === 200 || res.status === 201) {
        toast.success(enabled ? '已启用代理' : '已禁用代理')
        onToggle(config.id!, enabled)
      } else {
        throw new Error(res.data?.error || '操作失败')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '操作失败'
      toast.error(msg)
    } finally {
      setIsToggling(false)
    }
  }

  const handleCopy = () => {
    const proxyUrl = `${config.type}://${config.host}:${config.port}`
    navigator.clipboard.writeText(proxyUrl)
    toast.success('代理地址已复制到剪贴板')
  }

  const handleDelete = () => {
    onDelete(config.id!)
  }

  const typeLabels: Record<string, string> = {
    http: 'HTTP',
    https: 'HTTPS',
    socks5: 'SOCKS5',
  }

  return (
    <Card
      variant="outline"
      className={`relative overflow-hidden transition-all duration-200 ${
        config.enabled
          ? 'border-primary/50 bg-primary/5 shadow-md'
          : 'hover:border-muted-foreground/20'
      }`}
    >
      {/* 启用状态指示条 */}
      {config.enabled && (
        <div className="bg-primary/20 absolute inset-x-0 top-0 h-1" />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                config.enabled
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <Globe className="size-5" />
            </div>
            <div>
              <CardDescription className="text-foreground text-base font-medium">
                {config.name}
              </CardDescription>
              <p className="text-muted-foreground text-sm">
                {typeLabels[config.type]} • {config.host}:{config.port}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={config.enabled}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(config)}>
                  <Edit className="mr-2 size-4" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopy}>
                  <Copy className="mr-2 size-4" />
                  复制代理地址
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="text-muted-foreground flex items-center gap-4 text-xs">
          {config.username && (
            <span>
              <span className="font-medium">用户</span>: {config.username}
            </span>
          )}
          {config.createdAt && (
            <span>
              创建于{' '}
              {new Date(config.createdAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
          {config.updatedAt && (
            <span>
              更新于{' '}
              {new Date(config.updatedAt).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
