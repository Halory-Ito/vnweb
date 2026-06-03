'use client'

import {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Image,
  Moon,
  Puzzle,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  PROVIDER_SETTINGS_EVENT,
  readProviderSettings,
  setProviderEnabled,
} from '@/lib/settings/provider-settings'
import { getAllProviders } from '@/lib/providers'

import type { GameProviderPlugin, ProviderCapability } from '@/lib/providers'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Clapperboard,
  Gamepad2,
  Image,
  Moon,
  Puzzle,
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

export default function ProviderSettings() {
  const [providers, setProviders] = useState<
    Array<GameProviderPlugin & { enabled: boolean }>
  >([])

  const refresh = () => {
    setProviders(getAllProviders())
  }

  useEffect(() => {
    refresh()
    const handler = () => refresh()
    window.addEventListener(PROVIDER_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(PROVIDER_SETTINGS_EVENT, handler)
  }, [])

  const handleToggle = (id: string, enabled: boolean) => {
    setProviderEnabled(id, enabled)
    refresh()
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">游戏提供商插件</h3>
        <p className="text-muted-foreground text-sm">
          管理游戏数据来源提供商，禁用后将不再出现在添加游戏的选项中。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {providers.map((provider) => {
          const IconComponent = ICON_MAP[provider.icon] ?? Puzzle

          return (
            <Card
              key={provider.id}
              variant="outline"
              className={`relative overflow-hidden transition-all duration-200 ${
                provider.enabled
                  ? 'border-primary/50 bg-primary/5 shadow-md'
                  : 'opacity-60 hover:opacity-80'
              }`}
            >
              {provider.enabled && (
                <div className="bg-primary/20 absolute inset-x-0 top-0 h-1" />
              )}

              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-lg ${
                        provider.enabled
                          ? 'bg-primary/20 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <IconComponent className="size-5" />
                    </div>
                    <div>
                      <div className="text-base font-medium">
                        {provider.name}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {provider.description}
                      </p>
                    </div>
                  </div>

                  <Switch
                    checked={provider.enabled}
                    onCheckedChange={(checked) =>
                      handleToggle(provider.id, checked)
                    }
                  />
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {provider.capabilities.map((cap) => (
                    <Badge key={cap} variant={CAPABILITY_VARIANTS[cap]}>
                      {CAPABILITY_LABELS[cap]}
                    </Badge>
                  ))}
                </div>
                <div className="text-muted-foreground mt-2 text-xs">
                  v{provider.version}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
