'use client'

import { CloudDownload, FilePlus2 } from 'lucide-react'

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

function ProviderLogo({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="size-4 shrink-0 rounded-xs object-contain" />
}

export default function GameAddMenuItems({ compact = false }: { compact?: boolean }) {
  const { steamEnabled, bangumiEnabled, vndbEnabled, ymgalEnabled, hasBulkImport } =
    useGameImportAvailability()
  const itemClassName = compact ? 'min-h-10' : undefined

  const thirdPartyItems = (
    <>
      {steamEnabled ? (
        <SteamImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <ProviderLogo src="/logos/steam.ico" alt="Steam" />
            Steam
          </DropdownMenuItem>
        </SteamImportDialog>
      ) : null}
      {bangumiEnabled ? (
        <BangumiImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <ProviderLogo src="/logos/bangumi.ico" alt="Bangumi" />
            Bangumi
          </DropdownMenuItem>
        </BangumiImportDialog>
      ) : null}
      {vndbEnabled ? (
        <VndbImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <ProviderLogo src="/logos/vndb.ico" alt="VNDB" />
            VNDB
          </DropdownMenuItem>
        </VndbImportDialog>
      ) : null}
      {ymgalEnabled ? (
        <YmgalImportDialog>
          <DropdownMenuItem className={itemClassName} onSelect={(event) => event.preventDefault()}>
            <ProviderLogo src="/logos/ymgal.ico" alt="YMGal" />
            YMGal
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
