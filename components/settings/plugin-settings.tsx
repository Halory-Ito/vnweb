'use client'

import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Image,
  Moon,
  Puzzle,
  Tv,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  getAllPlugins,
  PLUGIN_SETTINGS_EVENT,
  togglePlugin,
} from '@/lib/plugins'

import type { AnyPlugin, ProviderCapability } from '@/lib/plugins'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Image,
  Moon,
  Puzzle,
  Tv,
  Zap,
}

const CAPABILITY_LABELS: Record<ProviderCapability, string> = {
  'manual-search': '手动搜索',
  'bulk-import': '批量导入',
  'account-bind': '账号绑定',
}

const CAPABILITY_VARIANTS: Record<
  ProviderCapability,
  'default' | 'secondary' | 'outline'
> = {
  'manual-search': 'default',
  'bulk-import': 'secondary',
  'account-bind': 'outline',
}

const TYPE_LABELS: Record<AnyPlugin['type'], string> = {
  provider: '数据源',
  feature: '功能增强',
  'character-provider': '角色数据源',
}

export default function PluginSettings() {
  const [plugins, setPlugins] = useState<
    Array<AnyPlugin & { enabled: boolean }>
  >([])

  const refresh = () => {
    setPlugins(getAllPlugins())
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener(PLUGIN_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(PLUGIN_SETTINGS_EVENT, handler)
  }, [])

  const handleToggle = async (id: string, enabled: boolean) => {
    await togglePlugin(id, enabled)
    refresh()
  }

  const providers = plugins.filter((p) => p.type === 'provider')
  const features = plugins.filter((p) => p.type === 'feature')
  const characterProviders = plugins.filter(
    (p) => p.type === 'character-provider',
  )

  return (
    <div className="space-y-8">
      {features.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">功能增强插件</h3>
            <p className="text-muted-foreground text-sm">
              扩展应用功能，如链接解析、元数据增强等。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      )}

      {providers.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">数据源插件</h3>
            <p className="text-muted-foreground text-sm">
              管理游戏数据来源，禁用后将不出现在添加游戏的选项中。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {providers.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      )}

      {characterProviders.length > 0 && (
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">角色数据源插件</h3>
            <p className="text-muted-foreground text-sm">
              管理角色信息的数据来源，禁用后同步角色时将跳过该数据源。
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {characterProviders.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PluginCard({
  plugin,
  onToggle,
}: {
  plugin: AnyPlugin & { enabled: boolean }
  onToggle: (id: string, enabled: boolean) => Promise<void> | void
}) {
  const IconComponent = ICON_MAP[plugin.icon] ?? Puzzle

  return (
    <Card
      variant="outline"
      className={`relative overflow-hidden transition-all duration-200 ${
        plugin.enabled
          ? 'border-primary/50 bg-primary/5 shadow-md'
          : 'opacity-60 hover:opacity-80'
      }`}
    >
      {plugin.enabled && (
        <div className="bg-primary/20 absolute inset-x-0 top-0 h-1" />
      )}

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-lg ${
                plugin.enabled
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <IconComponent className="size-5" />
            </div>
            <div>
              <div className="text-base font-medium">{plugin.name}</div>
              <p className="text-muted-foreground text-sm">
                {plugin.description}
              </p>
            </div>
          </div>

          <Switch
            checked={plugin.enabled}
            onCheckedChange={(checked) => onToggle(plugin.id, checked)}
          />
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{TYPE_LABELS[plugin.type]}</Badge>
          {plugin.type === 'provider' &&
            plugin.capabilities?.map((cap) => (
              <Badge key={cap} variant={CAPABILITY_VARIANTS[cap]}>
                {CAPABILITY_LABELS[cap]}
              </Badge>
            ))}
          {plugin.type === 'feature' &&
            plugin.hooks?.map((hook) => (
              <Badge key={hook} variant="secondary">
                {hook}
              </Badge>
            ))}
        </div>
        <div className="text-muted-foreground mt-2 text-xs">
          v{plugin.version}
        </div>
      </CardContent>
    </Card>
  )
}
