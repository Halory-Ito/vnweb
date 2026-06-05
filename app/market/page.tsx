'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FileArchive, Package, RefreshCw, Search, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { PluginCard } from '@/components/market/plugin-card'
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
import { Badge } from '@/components/ui/badge'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/request-utils'

type Plugin = {
  id: string
  name: string
  description: string
  version: string
  icon: string
  authors?: string[]
  installed?: boolean
}

type PluginImportPreview = {
  id: string
  name: string
  description: string
  version: string
  icon: string
  authors: string[]
  previewIconUrl?: string
}

type ImportPreviewResponse = {
  plugin: PluginImportPreview
  conflict?: boolean
  existingPlugin?: PluginImportPreview | null
}

export async function getErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: string
  }

  return payload.error || fallback
}

export function compareVersions(nextVersion: string, prevVersion: string) {
  const nextParts = nextVersion
    .split('.')
    .map((part) => Number.parseInt(part.replace(/\D/g, ''), 10) || 0)
  const prevParts = prevVersion
    .split('.')
    .map((part) => Number.parseInt(part.replace(/\D/g, ''), 10) || 0)

  const length = Math.max(nextParts.length, prevParts.length)

  for (let i = 0; i < length; i += 1) {
    const next = nextParts[i] ?? 0
    const prev = prevParts[i] ?? 0

    if (next > prev) {
      return 1
    }

    if (next < prev) {
      return -1
    }
  }

  return 0
}

export default function MarketPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] =
    useState<PluginImportPreview | null>(null)
  const [hasImportConflict, setHasImportConflict] = useState(false)
  const [existingPluginPreview, setExistingPluginPreview] =
    useState<PluginImportPreview | null>(null)
  const [overwriteConfirmOpen, setOverwriteConfirmOpen] = useState(false)

  const {
    data: plugins,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Plugin[]>({
    queryKey: ['plugins'],
    queryFn: async () => {
      const response = await api.get('/market/plugins')
      return response.data
    },
  })

  const installMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post('/market/plugins/install', { id })
      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
  })

  const uninstallMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post('/market/plugins/uninstall', { id })
      return response.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
  })

  const previewImportMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('action', 'preview')
      formData.append('file', file)

      const response = await api.post('/market/plugins/import', formData)
      return response.data as ImportPreviewResponse
    },
    onSuccess: (payload) => {
      setImportPreview(payload.plugin)
      setHasImportConflict(Boolean(payload.conflict))
      setExistingPluginPreview(payload.existingPlugin ?? null)
      toast.success('插件信息解析成功')
    },
    onError: (error) => {
      setImportPreview(null)
      setHasImportConflict(false)
      setExistingPluginPreview(null)
      toast.error(error.message)
    },
  })

  const confirmImportMutation = useMutation({
    mutationFn: async ({
      file,
      overwrite,
    }: {
      file: File
      overwrite: boolean
    }) => {
      const formData = new FormData()
      formData.append('action', 'import')
      formData.append('file', file)
      formData.append('overwrite', String(overwrite))

      const response = await api.post('/market/plugins/import', formData)
      return response.data
    },
    onSuccess: async () => {
      toast.success('插件导入成功')
      setImportDialogOpen(false)
      setOverwriteConfirmOpen(false)
      setSelectedZipFile(null)
      setImportPreview(null)
      setHasImportConflict(false)
      setExistingPluginPreview(null)
      await queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handlePickZipFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setImportPreview(null)
    setHasImportConflict(false)
    setExistingPluginPreview(null)

    if (!file) {
      setSelectedZipFile(null)
      return
    }

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setSelectedZipFile(null)
      toast.error('仅支持 .zip 压缩文件')
      event.target.value = ''
      return
    }

    setSelectedZipFile(file)
    previewImportMutation.mutate(file)
  }

  const runImport = (overwrite: boolean) => {
    confirmImportMutation.mutate({ file: selectedZipFile as File, overwrite })
  }

  const handleConfirmImport = () => {
    if (hasImportConflict) {
      setOverwriteConfirmOpen(true)
      return
    }

    runImport(false)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setImportDialogOpen(open)

    if (!open) {
      setOverwriteConfirmOpen(false)
      setSelectedZipFile(null)
      setImportPreview(null)
      setHasImportConflict(false)
      setExistingPluginPreview(null)
      previewImportMutation.reset()
      confirmImportMutation.reset()
    }
  }

  const availablePlugins = plugins || []
  const installedPlugins = availablePlugins.filter((plugin) => plugin.installed)
  const versionCompareResult =
    importPreview && existingPluginPreview
      ? compareVersions(importPreview.version, existingPluginPreview.version)
      : null

  return (
    <div className="container mx-auto p-4 md:p-6">
      {/* 页面标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 flex size-12 items-center justify-center rounded-xl">
            <Package className="text-primary size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">插件市场</h1>
            <p className="text-muted-foreground text-sm">
              发现并安装优秀的插件来增强你的体验
            </p>
          </div>
        </div>
      </div>

      {/* 搜索和操作栏 */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input placeholder="搜索插件..." className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 size-4" />
            导入插件
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`size-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
          </Button>
        </div>
      </div>

      {/* 插件列表 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="all">
            全部
            <Badge variant="secondary" className="ml-2">
              {availablePlugins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="installed">
            已安装
            <Badge variant="secondary" className="ml-2">
              {installedPlugins.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="updates">
            可更新
            <Badge variant="secondary" className="ml-2">
              0
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : availablePlugins.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {availablePlugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  installing={
                    installMutation.isPending &&
                    installMutation.variables === plugin.id
                  }
                  uninstalling={
                    uninstallMutation.isPending &&
                    uninstallMutation.variables === plugin.id
                  }
                  onInstall={() => installMutation.mutate(plugin.id)}
                  onUninstall={() => uninstallMutation.mutate(plugin.id)}
                  onViewDetails={() =>
                    router.push(`/addOns/${plugin.id}/intro`)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="暂无插件"
              description="插件市场中还没有可用的插件"
            />
          )}
        </TabsContent>

        <TabsContent value="installed">
          {installedPlugins.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {installedPlugins.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  installing={
                    installMutation.isPending &&
                    installMutation.variables === plugin.id
                  }
                  uninstalling={
                    uninstallMutation.isPending &&
                    uninstallMutation.variables === plugin.id
                  }
                  onInstall={() => installMutation.mutate(plugin.id)}
                  onUninstall={() => uninstallMutation.mutate(plugin.id)}
                  onViewDetails={() =>
                    router.push(`/addOns/${plugin.id}/intro`)
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Package}
              title="暂无已安装插件"
              description="你还没有安装任何插件"
            />
          )}
        </TabsContent>

        <TabsContent value="updates">
          <EmptyState
            icon={RefreshCw}
            title="所有插件已是最新版本"
            description="没有可用的更新"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={importDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入插件</DialogTitle>
            <DialogDescription>
              上传插件压缩包，系统会解析 manifest.ts 并展示插件信息
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plugin-zip">插件压缩文件（.zip）</Label>
              <Input
                id="plugin-zip"
                type="file"
                accept=".zip,application/zip"
                onChange={handlePickZipFile}
                disabled={
                  previewImportMutation.isPending ||
                  confirmImportMutation.isPending
                }
              />
              {previewImportMutation.isPending && (
                <p className="text-muted-foreground text-xs">正在解析插件...</p>
              )}
            </div>

            {importPreview ? (
              <div className="bg-muted/50 space-y-3 rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <FileArchive className="text-primary size-4" />
                  <p className="text-sm font-medium">插件信息</p>
                </div>

                <div className="bg-background overflow-hidden rounded-md border">
                  {importPreview.previewIconUrl ? (
                    <img
                      src={importPreview.previewIconUrl}
                      alt={importPreview.name}
                      className="h-32 w-full object-cover"
                    />
                  ) : (
                    <div className="text-muted-foreground flex h-32 items-center justify-center text-xs">
                      未找到可预览的插件图标
                    </div>
                  )}
                </div>

                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">ID：</span>
                    {importPreview.id}
                  </p>
                  <p>
                    <span className="text-muted-foreground">名称：</span>
                    {importPreview.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">版本：</span>
                    {importPreview.version}
                  </p>
                  <p>
                    <span className="text-muted-foreground">作者：</span>
                    {importPreview.authors.length > 0
                      ? importPreview.authors.join(', ')
                      : '未知作者'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">描述：</span>
                    {importPreview.description || '暂无描述'}
                  </p>
                </div>

                {hasImportConflict && (
                  <p className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-700">
                    检测到同名插件，确认时将进入覆盖确认流程
                  </p>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
                请先上传插件压缩文件
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogOpenChange(false)}
              disabled={confirmImportMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleConfirmImport}
              disabled={
                !importPreview ||
                !selectedZipFile ||
                previewImportMutation.isPending ||
                confirmImportMutation.isPending
              }
            >
              {confirmImportMutation.isPending ? '导入中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={overwriteConfirmOpen}
        onOpenChange={setOverwriteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>检测到同名插件</AlertDialogTitle>
            <AlertDialogDescription>
              插件 ID 为 {importPreview?.id}{' '}
              的插件已存在，覆盖后将替换当前插件文件。是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>

          {importPreview && (
            <div className="bg-muted/50 grid gap-3 rounded-md border p-3 text-sm">
              <div className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
                <span className="text-muted-foreground">字段</span>
                <span className="text-muted-foreground">现有插件</span>
                <span className="text-muted-foreground">导入插件</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
                <span className="text-muted-foreground">名称</span>
                <span>{existingPluginPreview?.name || '-'}</span>
                <span>{importPreview.name}</span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
                <span className="text-muted-foreground">版本</span>
                <span className="inline-flex items-center gap-2">
                  {existingPluginPreview?.version || '-'}
                </span>
                <span className="inline-flex items-center gap-2">
                  {importPreview.version}
                  {versionCompareResult !== null && (
                    <Badge
                      variant="secondary"
                      className={
                        versionCompareResult > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {versionCompareResult > 0 ? '升级' : '非升级'}
                    </Badge>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-[80px_1fr_1fr] items-center gap-2">
                <span className="text-muted-foreground">作者</span>
                <span>
                  {existingPluginPreview?.authors?.length
                    ? existingPluginPreview.authors.join(', ')
                    : '-'}
                </span>
                <span>
                  {importPreview.authors.length
                    ? importPreview.authors.join(', ')
                    : '-'}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirmImportMutation.isPending}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={confirmImportMutation.isPending}
              onClick={() => runImport(true)}
            >
              {confirmImportMutation.isPending ? '覆盖中...' : '覆盖'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Package
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
        <Icon className="text-muted-foreground size-8" />
      </div>
      <h3 className="mb-2 text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
    </div>
  )
}
