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
  PROVIDER_SETTINGS_EVENT,
  readProviderSettings,
  isProviderEnabled,
} from '@/lib/settings/provider-settings'

import {
  BangumiImportDialog,
  SteamImportDialog,
  VNDBSearchDialog,
  VndbImportDialog,
} from './vndb-search-dialog'

export default function GameAddButton() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const handler = () => setTick((t) => t + 1)
    window.addEventListener(PROVIDER_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(PROVIDER_SETTINGS_EVENT, handler)
  }, [])

  const settings = readProviderSettings()
  const steamEnabled = isProviderEnabled('steam', settings)
  const bangumiEnabled = isProviderEnabled('bangumi', settings)
  const vndbEnabled = isProviderEnabled('vndb', settings)
  const hasBulkImport = steamEnabled || bangumiEnabled || vndbEnabled

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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
