'use client'

import {
  Clapperboard,
  Gamepad2,
  Import,
  PlusCircleIcon,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  PLUGIN_SETTINGS_EVENT,
  isPluginEnabled,
  readPluginSettings,
} from '@/lib/plugins'

import {
  BangumiImportDialog,
  SteamImportDialog,
  VNDBSearchDialog,
  VndbImportDialog,
  YmgalImportDialog,
} from './vndb-search-dialog'

export default function GameAddButton() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    window.addEventListener(PLUGIN_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(PLUGIN_SETTINGS_EVENT, handler)
  }, [])

  const settings = readPluginSettings()
  const steamEnabled = isPluginEnabled('steam', settings)
  const bangumiEnabled = isPluginEnabled('bangumi', settings)
  const vndbEnabled = isPluginEnabled('vndb', settings)
  const ymgalEnabled = isPluginEnabled('ymgal', settings)
  const hasBulkImport =
    steamEnabled || bangumiEnabled || vndbEnabled || ymgalEnabled

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <PlusCircleIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>添加游戏</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <VNDBSearchDialog>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <Import className="mr-2 size-4" />
            手动添加
          </DropdownMenuItem>
        </VNDBSearchDialog>

        {hasBulkImport && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Import className="mr-2 size-4" />
              从第三方导入
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {steamEnabled && (
                <SteamImportDialog>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Gamepad2 className="mr-2 size-4" />
                    从 Steam 导入
                  </DropdownMenuItem>
                </SteamImportDialog>
              )}
              {bangumiEnabled && (
                <BangumiImportDialog>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Clapperboard className="mr-2 size-4" />
                    从 bangumi 导入
                  </DropdownMenuItem>
                </BangumiImportDialog>
              )}
              {vndbEnabled && (
                <VndbImportDialog>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Clapperboard className="mr-2 size-4" />
                    从 VNDB 导入
                  </DropdownMenuItem>
                </VndbImportDialog>
              )}
              {ymgalEnabled && (
                <YmgalImportDialog>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Clapperboard className="mr-2 size-4" />
                    从 YMGal 导入
                  </DropdownMenuItem>
                </YmgalImportDialog>
              )}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
