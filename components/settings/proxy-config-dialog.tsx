'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/request-utils'

import type { ProxyType } from '@/lib/proxy-settings'

export interface ProxyConfig {
  id?: number
  name: string
  type: ProxyType
  host: string
  port: number
  username: string
  password: string
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

interface ProxyConfigDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  editData?: ProxyConfig | null
}

export function ProxyConfigDialog({
  open,
  onOpenChange,
  onSuccess,
  editData,
}: ProxyConfigDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<ProxyConfig>({
    name: '',
    type: 'http',
    host: '',
    port: 7890,
    username: '',
    password: '',
    enabled: false,
  })

  useEffect(() => {
    if (editData) {
      setFormData({
        id: editData.id,
        name: editData.name,
        type: editData.type,
        host: editData.host,
        port: editData.port,
        username: editData.username || '',
        password: editData.password || '',
        enabled: editData.enabled,
      })
    } else {
      setFormData({
        name: '',
        type: 'http',
        host: '',
        port: 7890,
        username: '',
        password: '',
        enabled: false,
      })
    }
  }, [editData, open])

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入配置名称')
      return
    }
    if (!formData.host.trim()) {
      toast.error('请输入代理服务器地址')
      return
    }
    if (!formData.port || formData.port <= 0) {
      toast.error('请输入有效的端口号')
      return
    }

    setIsSubmitting(true)

    try {
      if (editData?.id) {
        // 更新
        const res = await api.request({
          method: 'PUT',
          url: '/settings/proxy',
          data: formData,
        })
        if (res.status === 200 || res.status === 201) {
          toast.success('代理配置已更新')
          onSuccess()
          onOpenChange(false)
        } else {
          throw new Error(res.data?.error || '更新失败')
        }
      } else {
        // 创建
        const res = await api.request({
          method: 'POST',
          url: '/settings/proxy',
          data: formData,
        })
        if (res.status === 200 || res.status === 201) {
          toast.success('代理配置已保存')
          onSuccess()
          onOpenChange(false)
        } else {
          throw new Error(res.data?.error || '保存失败')
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '操作失败'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editData?.id ? '编辑代理配置' : '新增代理配置'}
          </DialogTitle>
          <DialogDescription>
            {editData?.id
              ? '修改代理配置信息'
              : '填写代理服务器信息来创建新的代理配置'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 配置名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">配置名称</Label>
            <Input
              id="name"
              placeholder="例如：香港节点1"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          {/* 协议类型 */}
          <div className="space-y-2">
            <Label htmlFor="type">协议类型</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  type: value as ProxyType,
                }))
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="选择协议类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="http">HTTP</SelectItem>
                <SelectItem value="https">HTTPS</SelectItem>
                <SelectItem value="socks5">SOCKS5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 服务器地址和端口 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="host">服务器地址</Label>
              <Input
                id="host"
                placeholder="127.0.0.1"
                value={formData.host}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, host: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">端口</Label>
              <Input
                id="port"
                type="number"
                placeholder="7890"
                value={formData.port || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    port: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {/* 认证信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                placeholder="可选"
                value={formData.username}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, username: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="可选"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
          </div>

          {/* 启用开关 */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm">启用此配置</Label>
              <p className="text-muted-foreground text-xs">
                启用后将成为当前使用的代理
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="mr-2 size-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
