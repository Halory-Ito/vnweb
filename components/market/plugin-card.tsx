'use client'

import { Eye, Package, User } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Plugin = {
  id: string
  name: string
  description: string
  version: string
  icon: string
  authors?: string[]
  installed?: boolean
}

type PluginCardProps = {
  plugin: Plugin
  onViewDetails?: () => void
  onInstall?: () => void
  onUninstall?: () => void
  installing?: boolean
  uninstalling?: boolean
}

export function PluginCard({
  plugin,
  onViewDetails,
  onInstall,
  onUninstall,
  installing,
  uninstalling,
}: PluginCardProps) {
  const [imageError, setImageError] = useState(false)
  const authorText = plugin.authors?.length
    ? plugin.authors.join(', ')
    : '未知作者'

  return (
    <Card
      variant="outline"
      className="group hover:shadow-primary/5 mt-0 overflow-hidden pt-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
      onClick={onViewDetails}
    >
      <div className="bg-muted relative aspect-16/8 overflow-hidden">
        {plugin.icon && !imageError ? (
          <Image
            src={plugin.icon}
            alt={plugin.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, (max-width: 1536px) 33vw, 25vw"
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Package className="text-muted-foreground/30 size-12" />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="flex min-w-0 flex-col gap-3 p-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex items-start gap-2">
            <h3 className="line-clamp-1 text-sm font-semibold">
              {plugin.name}
            </h3>
            <Badge variant="secondary" className="shrink-0 text-xs">
              v{plugin.version}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-2 line-clamp-2 text-xs leading-5">
            {plugin.description || '暂无描述'}
          </p>
          <p className="text-muted-foreground flex items-center gap-2 text-xs">
            <User className="size-3.5" />
            {authorText}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            className="h-8 w-full text-xs"
            variant={plugin.installed ? 'destructive' : 'outline'}
            disabled={installing || uninstalling}
            onClick={(event) => {
              event.stopPropagation()
              if (plugin.installed) {
                onUninstall?.()
                return
              }

              onInstall?.()
            }}
          >
            {installing
              ? '安装中...'
              : uninstalling
                ? '卸载中...'
                : plugin.installed
                  ? '卸载'
                  : '安装'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full text-xs"
            onClick={(event) => {
              event.stopPropagation()
              onViewDetails?.()
            }}
          >
            <Eye className="mr-1 size-3.5" />
            查看详情
          </Button>
        </div>
      </div>
    </Card>
  )
}
