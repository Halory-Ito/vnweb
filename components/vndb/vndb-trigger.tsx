import { PlusCircleIcon } from 'lucide-react'

import { SteamImportDialog, VNDBSearchDialog } from './vndb-search-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function VNDBTrigger() {
  return (
    <>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="icon">
                <PlusCircleIcon />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>添加游戏</TooltipContent>
        </Tooltip>
        <DropdownMenuContent className="w-48">
          <DropdownMenuGroup>
            <VNDBSearchDialog>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                手动添加
              </DropdownMenuItem>
            </VNDBSearchDialog>
            <SteamImportDialog>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                从 Steam 导入
              </DropdownMenuItem>
            </SteamImportDialog>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
