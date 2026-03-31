'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import {
  type ProxySettings,
  type ProxyType,
  PROXY_SETTINGS_EVENT,
  readProxySettings,
  writeProxySettings,
  notifyProxySettingsChanged,
  DEFAULT_PROXY_SETTINGS,
} from '@/lib/proxy-settings'

export default function ProxyPage() {
  const [settings, setSettings] = useState<ProxySettings>(
    DEFAULT_PROXY_SETTINGS,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [proxyUrlPreview, setProxyUrlPreview] = useState('')

  useEffect(() => {
    setSettings(readProxySettings())

    const handleChange = () => {
      setSettings(readProxySettings())
    }

    window.addEventListener(PROXY_SETTINGS_EVENT, handleChange)
    return () => {
      window.removeEventListener(PROXY_SETTINGS_EVENT, handleChange)
    }
  }, [])

  // 预览代理 URL
  useEffect(() => {
    if (settings.enabled && settings.host && settings.port) {
      const auth =
        settings.username && settings.password
          ? `${settings.username}:${settings.password}@`
          : ''
      setProxyUrlPreview(
        `${settings.type}://${auth}${settings.host}:${settings.port}`,
      )
    } else {
      setProxyUrlPreview('')
    }
  }, [settings])

  const handleSave = () => {
    if (settings.enabled && !settings.host) {
      toast.error('请输入代理服务器地址')
      return
    }

    setIsSaving(true)

    try {
      writeProxySettings(settings)
      notifyProxySettingsChanged()
      toast.success('代理设置已保存')
    } catch {
      toast.error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }

  const updateSetting = <K extends keyof ProxySettings>(
    key: K,
    value: ProxySettings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">网络代理设置</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          配置代理服务器以访问被屏蔽的外部服务（如 Steam API）
        </p>
      </div>

      {/* 状态卡片 */}
      <Card variant="outline" className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                settings.enabled && settings.host
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <svg
                viewBox="0 0 24 24"
                className="size-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l2 2" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium">
                {settings.enabled && settings.host
                  ? '代理已启用'
                  : '代理未启用'}
              </div>
              <div className="text-muted-foreground text-sm">
                {settings.enabled && settings.host
                  ? proxyUrlPreview
                  : '点击开关启用代理配置'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 配置卡片 */}
      <Card variant="outline">
        <CardHeader className="pb-4">
          <CardTitle>代理配置</CardTitle>
          <CardDescription>支持 HTTP、HTTPS 和 SOCKS5 代理协议</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 启用开关 */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">启用代理</Label>
              <p className="text-muted-foreground text-sm">
                开启后 Steam 相关请求将通过代理发送
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => updateSetting('enabled', checked)}
            />
          </div>

          {/* 服务器配置 */}
          <div className="space-y-4">
            <Label className="text-base">服务器信息</Label>
            <div className="grid gap-4 sm:grid-cols-12">
              <div className="sm:col-span-3">
                <Label
                  htmlFor="proxyType"
                  className="text-muted-foreground text-xs"
                >
                  协议
                </Label>
                <Select
                  value={settings.type}
                  onValueChange={(value) =>
                    updateSetting('type', value as ProxyType)
                  }
                >
                  <SelectTrigger id="proxyType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-6">
                <Label
                  htmlFor="proxyHost"
                  className="text-muted-foreground text-xs"
                >
                  服务器地址
                </Label>
                <Input
                  id="proxyHost"
                  placeholder="127.0.0.1"
                  value={settings.host}
                  onChange={(e) => updateSetting('host', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-3">
                <Label
                  htmlFor="proxyPort"
                  className="text-muted-foreground text-xs"
                >
                  端口
                </Label>
                <Input
                  id="proxyPort"
                  type="number"
                  placeholder="7890"
                  value={settings.port || ''}
                  onChange={(e) =>
                    updateSetting('port', parseInt(e.target.value, 10) || 0)
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 认证信息 */}
          <div className="space-y-4">
            <Label className="text-base">
              认证信息
              <span className="text-muted-foreground ml-2 text-xs font-normal">
                （可选）
              </span>
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label
                  htmlFor="proxyUsername"
                  className="text-muted-foreground text-xs"
                >
                  用户名
                </Label>
                <Input
                  id="proxyUsername"
                  placeholder="代理认证用户名"
                  value={settings.username}
                  onChange={(e) => updateSetting('username', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="proxyPassword"
                  className="text-muted-foreground text-xs"
                >
                  密码
                </Label>
                <Input
                  id="proxyPassword"
                  type="password"
                  placeholder="代理认证密码"
                  value={settings.password}
                  onChange={(e) => updateSetting('password', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* 保存按钮 */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="lg"
              className="min-w-32"
            >
              {isSaving ? (
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
                <>
                  <svg
                    viewBox="0 0 24 24"
                    className="mr-2 size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  保存设置
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 常见端口参考 */}
      <Card variant="outline">
        <CardHeader className="pb-4">
          <CardTitle>常见代理端口参考</CardTitle>
          <CardDescription>常用代理软件的默认监听端口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                  C
                </div>
                <span className="font-medium">Clash</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                HTTP: 7890 · SOCKS5: 7891
              </div>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                  V
                </div>
                <span className="font-medium">V2Ray</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                HTTP: 10808 · SOCKS5: 10809
              </div>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                  S
                </div>
                <span className="font-medium">Shadowsocks</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                1080
              </div>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                  Su
                </div>
                <span className="font-medium">Surge</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                7890
              </div>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                  Q
                </div>
                <span className="font-medium">Quantumult X</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                8099
              </div>
            </div>
            <div className="bg-muted/30 flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded text-xs font-medium">
                  SG
                </div>
                <span className="font-medium">SagerNet</span>
              </div>
              <div className="text-muted-foreground font-mono text-xs">
                1080 / 10808
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 故障排除 */}
      <Card
        variant="outline"
        className="border-amber-200 dark:border-amber-900"
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <svg
              viewBox="0 0 24 24"
              className="size-5 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            连接超时？
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <p>1. 确认 Clash 或其他代理软件正在运行</p>
          <p>2. 检查「启用局域网连接」选项已开启（部分代理软件需要）</p>
          <p>3. 确认端口号与代理软件中的监听端口一致</p>
          <p>4. 如果使用 SOCKS5 代理，端口通常与 HTTP 代理不同</p>
        </CardContent>
      </Card>
    </div>
  )
}
