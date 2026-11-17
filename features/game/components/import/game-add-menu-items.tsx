'use client'

import { Clapperboard, CloudDownload, FilePlus2, Gamepad2 } from 'lucide-react'

import { useGameImportAvailability } from '../../hooks/use-game-import-availability'
import { BangumiImportDialog } from './bangumi-import-dialog'
import { ManualImportDialog } from './manual-import-dialog'
import { SteamImportDialog } from './steam-import-dialog'
import { ThirdPartyImportDialog } from './third-party-import-dialog'
import { VndbImportDialog } from './vndb-import-dialog'
import { YmgalImportDialog } from './ymgal-import-dialog'
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'

export default function GameAddMenuItems({ compact = false }: { compact?: boolean }) {
  const { steamEnabled, bangumiEnabled, vndbEnabled, ymgalEnabled, hasBulkImport } =
    useGameImportAvailability()
  const itemClassName = compact ? 'min-h-10' : undefined

  const thirdPartyItems = (
    <>
      {steamEnabled ? (
        <SteamImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <Gamepad2 />从 Steam 导入
          </DropdownMenuItem>
        </SteamImportDialog>
      ) : null}
      {bangumiEnabled ? (
        <BangumiImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <Clapperboard />从 bangumi 导入
          </DropdownMenuItem>
        </BangumiImportDialog>
      ) : null}
      {vndbEnabled ? (
        <VndbImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <Clapperboard />从 VNDB 导入
          </DropdownMenuItem>
        </VndbImportDialog>
      ) : null}
      {ymgalEnabled ? (
        <YmgalImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <Clapperboard />从 YMGal 导入
          </DropdownMenuItem>
        </YmgalImportDialog>
      ) : null}
    </>
  )

  return (
    <>
      <ManualImportDialog>
        <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
          <FilePlus2 />
          手动添加
        </DropdownMenuItem>
      </ManualImportDialog>
      {hasBulkImport ? (
        compact ? (
          <ThirdPartyImportDialog>
            <DropdownMenuItem
              className={itemClassName}
              onSelect={(event) => event.preventDefault()}
            >
              <CloudDownload />
              从第三方导入
            </DropdownMenuItem>
          </ThirdPartyImportDialog>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <CloudDownload />
              从第三方导入
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>{thirdPartyItems}</DropdownMenuSubContent>
          </DropdownMenuSub>
        )
      ) : null}
    </>
  )
}
