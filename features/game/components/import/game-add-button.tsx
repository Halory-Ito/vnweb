'use client'

import { PlusCircleIcon } from 'lucide-react'

import GameAddMenuItems from './game-add-menu-items'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHeaderDropdownMenu } from '@/hooks/use-header-dropdown-menu'

export default function GameAddButton({ desktopOnly = false }: { desktopOnly?: boolean }) {
  const { open, setOpen } = useHeaderDropdownMenu(desktopOnly ? 'desktop' : 'all')

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label="添加游戏">
          <PlusCircleIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <GameAddMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
