'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, RefreshCw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { PluginCard } from '@/components/market/plugin-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Plugin = {
  id: string
  name: string
  description: string
  version: string
  icon: string
  authors?: string[]
  installed?: boolean
}

export default function MarketPage() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const {
    data: plugins,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<Plugin[]>({
    queryKey: ['plugins'],
    queryFn: async () => {
      const response = await fetch('/api/market/plugins')
      if (!response.ok) throw new Error('Failed to fetch plugins')
      return response.json()
    },
  })

  const installMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/market/plugins/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to install plugin')
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
  })

  const uninstallMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch('/api/market/plugins/uninstall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        throw new Error('Failed to uninstall plugin')
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['plugins'] })
    },
  })

  const availablePlugins = plugins || []
  const installedPlugins = availablePlugins.filter((plugin) => plugin.installed)

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
