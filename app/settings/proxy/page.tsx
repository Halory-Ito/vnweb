'use client'

import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ProxyConfigCard } from '@/components/settings/proxy-config-card'
import {
  ProxyConfigDialog,
  type ProxyConfig,
} from '@/components/settings/proxy-config-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/request-utils'

// 常用测试地址
const PRESET_TEST_URLS = [
  { label: 'YouTube', url: 'https://www.youtube.com' },
  { label: 'Google', url: 'https://www.google.com' },
  { label: 'X (Twitter)', url: 'https://x.com' },
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'Steam', url: 'https://store.steampowered.com' },
]

// 测试结果接口
interface TestResult {
  success: boolean
  status?: number
  statusText?: string
  latency?: number
  error?: string
  proxy?: string | null
  message?: string
}

export default function ProxyPage() {
  const [proxyList, setProxyList] = useState<ProxyConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [testUrl, setTestUrl] = useState('https://www.youtube.com')
  const [testResult, setTestResult] = useState<TestResult | null>(null)

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<ProxyConfig | null>(null)

  // 删除确认
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 获取代理列表
  const fetchProxies = async () => {
    try {
      const res = await api.request({
        method: 'GET',
        url: '/settings/proxy',
      })
      if (res.status === 200) {
        setProxyList(
          res.data.data.map(
            (p: {
              id: number
              name: string
              type: string
              host: string
              port: number
              username: string
              password: string
              enabled: number
              createdAt?: string
              updatedAt?: string
            }) => ({
              id: p.id,
              name: p.name,
              type: p.type as ProxyConfig['type'],
              host: p.host,
              port: p.port,
              username: p.username,
              password: p.password,
              enabled: Boolean(p.enabled),
              createdAt: p.createdAt,
              updatedAt: p.updatedAt,
            }),
          ),
        )
      }
    } catch (error) {
      console.error('Failed to fetch proxies:', error)
      toast.error('加载代理列表失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProxies()
  }, [])

  // 测试代理连接
  const handleTestProxy = async () => {
    const activeProxy = proxyList.find((p) => p.enabled)
    if (!testUrl.trim()) {
      toast.error('请输入测试URL')
      return
    }
    if (!activeProxy) {
      toast.error('请先启用一个代理配置')
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const proxyUrl = `${activeProxy.type}://${activeProxy.host}:${activeProxy.port}`
      const response = await api.request({
        method: 'GET',
        url: `/settings/proxy/test?url=${encodeURIComponent(testUrl)}&proxy=${encodeURIComponent(proxyUrl)}`,
      })

      const result = response.data as TestResult
      setTestResult(result)

      if (result.success) {
        toast.success(`${result.message}成功！延迟: ${result.latency}ms`)
      } else {
        toast.error(`${result.message}失败: ${result.error}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      setTestResult({
        success: false,
        error: errorMessage,
      })
      toast.error(`测试失败: ${errorMessage}`)
    } finally {
      setIsTesting(false)
    }
  }

  // 新增代理
  const handleAdd = () => {
    setEditData(null)
    setDialogOpen(true)
  }

  // 编辑代理
  const handleEdit = (config: ProxyConfig) => {
    setEditData(config)
    setDialogOpen(true)
  }

  // 删除代理
  const handleDeleteClick = (id: number) => {
    setDeleteId(id)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const res = await api.request({
        method: 'DELETE',
        url: `/settings/proxy?id=${deleteId}`,
      })
      if (res.status === 200) {
        toast.success('代理配置已删除')
        setProxyList((prev) => prev.filter((p) => p.id !== deleteId))
      } else {
        throw new Error(res.data?.error || '删除失败')
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : '删除失败'
      toast.error(msg)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  // 切换代理启用状态
  const handleToggle = (id: number, enabled: boolean) => {
    setProxyList((prev) =>
      prev.map((p) => ({
        ...p,
        enabled: p.id === id ? enabled : enabled ? false : p.enabled,
      })),
    )
  }

  const activeProxy = proxyList.find((p) => p.enabled)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            网络代理设置
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理多个代理配置，快速切换使用
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 size-4" />
          新增代理
        </Button>
      </div>

      {/* 状态卡片 */}
      <Card variant="outline" className="mt-0 border-dashed pt-0">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                activeProxy
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
                {activeProxy ? `已启用: ${activeProxy.name}` : '未启用任何代理'}
              </div>
              <div className="text-muted-foreground text-sm">
                {activeProxy
                  ? `${activeProxy.type.toUpperCase()} • ${activeProxy.host}:${activeProxy.port}`
                  : '点击新增代理来添加配置，或启用已有代理'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试代理连接 */}
      <Card variant="outline">
        <CardHeader className="pb-4">
          <CardTitle>测试代理连接</CardTitle>
          <CardDescription>
            通过已启用的代理服务器测试访问目标网站，验证代理是否生效
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 常用测试地址 */}
          <div className="space-y-2">
            <Label className="text-sm">常用测试地址</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEST_URLS.map((preset) => (
                <Button
                  key={preset.url}
                  variant={testUrl === preset.url ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTestUrl(preset.url)}
                  className="h-8 text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* 测试输入框 */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Label htmlFor="testUrl" className="sr-only">
                测试URL
              </Label>
              <Input
                id="testUrl"
                placeholder="输入要测试的URL"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleTestProxy}
              disabled={isTesting || !activeProxy || !testUrl.trim()}
              className="min-w-24"
            >
              {isTesting ? (
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
                  测试中...
                </>
              ) : (
                '测试'
              )}
            </Button>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div
              className={`rounded-lg p-4 ${
                testResult.success
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.success ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 size-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="mt-0.5 size-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                )}
                <div className="flex-1">
                  <p className="font-medium">
                    {testResult.success ? `访问成功！` : `访问失败`}
                  </p>
                  <div className="mt-1 text-sm opacity-80">
                    {testResult.success ? (
                      <>
                        <p>
                          HTTP {testResult.status} {testResult.statusText}
                        </p>
                        <p>延迟: {testResult.latency}ms</p>
                        {testResult.proxy && (
                          <p className="mt-1 font-mono text-xs break-all">
                            代理: {testResult.proxy}
                          </p>
                        )}
                      </>
                    ) : (
                      <p>{testResult.error}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 代理列表 */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">代理配置列表</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            点击卡片切换当前使用的代理
          </p>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center">
            加载中...
          </div>
        ) : proxyList.length === 0 ? (
          <Empty className="border-dashed">
            <EmptyTitle>暂无代理配置</EmptyTitle>
            <EmptyDescription>
              点击右上角的「新增代理」按钮来添加第一个代理配置
            </EmptyDescription>
            <Button onClick={handleAdd} className="mt-4">
              <Plus className="mr-2 size-4" />
              新增代理
            </Button>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {proxyList.map((proxy) => (
              <ProxyConfigCard
                key={proxy.id}
                config={proxy}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* 新增/编辑对话框 */}
      <ProxyConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchProxies}
        editData={editData}
      />

      {/* 删除确认 */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这个代理配置吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
