'use client'

import { useState } from 'react'

import { PLATFORM_LABELS } from '../hooks/use-platform-accounts'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  platformFeatureCategories,
  platformVisibilityKeys,
  type PlatformFeatureCategory,
  type PlatformVisibilityKey,
} from '@/lib/settings/platform-visibility'

const labels: Record<PlatformVisibilityKey, string> = {
  ...PLATFORM_LABELS,
  steamgriddb: 'SteamGridDB',
  igdb: 'IGDB',
  rawg: 'RAWG',
  thegamesdb: 'TheGamesDB',
  giantbomb: 'Giant Bomb',
  yandere: 'Yande.re',
  konachan: 'Konachan',
  safebooru: 'Safebooru',
  danbooru: 'Danbooru',
  gelbooru: 'Gelbooru',
  wallhaven: 'Wallhaven',
  meting: 'Meting SDK',
  enhanced: '网易云 Enhanced API',
}

const statusSyncAnchorKeys = ['bangumi', 'vndb'] as const

export function PlatformVisibilityGrid({
  isFeatureEnabled,
  isConfigVisible,
  onChange,
  disabled,
}: {
  isFeatureEnabled: (category: PlatformFeatureCategory, key: PlatformVisibilityKey) => boolean
  isConfigVisible: (key: PlatformVisibilityKey) => boolean
  onChange: (
    category: PlatformFeatureCategory,
    key: PlatformVisibilityKey,
    visible: boolean,
  ) => void
  disabled: boolean
}) {
  const [activeCategory, setActiveCategory] = useState<PlatformFeatureCategory>(
    platformFeatureCategories[0].id,
  )

  return (
    <section
      aria-labelledby="platform-visibility-title"
      className="dark:border-input dark:bg-input/20 relative min-w-0 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      {platformVisibilityKeys.map(
        (key) =>
          !isConfigVisible(key) && (
            <span
              key={`anchor-${key}`}
              id={`platform-section-${key}`}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 scroll-mt-4"
            />
          ),
      )}
      {statusSyncAnchorKeys.map(
        (key) =>
          !isConfigVisible(key) && (
            <span
              key={`status-anchor-${key}`}
              id={`status-mappings-${key}`}
              aria-hidden="true"
              className="pointer-events-none absolute top-0 scroll-mt-4"
            />
          ),
      )}
      <h2 id="platform-visibility-title" className="text-base font-semibold">
        启用平台
      </h2>
      <Tabs
        value={activeCategory}
        onValueChange={(value) => setActiveCategory(value as PlatformFeatureCategory)}
        className="min-w-0 gap-4"
      >
        <TabsList className="w-fit max-w-full flex-wrap justify-start gap-1 group-data-[orientation=horizontal]/tabs:h-auto dark:bg-transparent">
          {platformFeatureCategories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="h-auto min-h-8 flex-none px-2.5 py-1"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {platformFeatureCategories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="border-t pt-4">
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              {category.platforms.map((key) => (
                <label
                  key={`${category.id}-${key}`}
                  className="flex min-w-0 items-center justify-between gap-3 py-0.5 text-sm"
                >
                  <span className="truncate">{labels[key]}</span>
                  <Switch
                    checked={isFeatureEnabled(category.id, key)}
                    disabled={disabled}
                    onCheckedChange={(next) => onChange(category.id, key, next)}
                  />
                </label>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
