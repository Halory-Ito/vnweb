'use client'

import { EyeIcon, MoonIcon, MoreHorizontalIcon, SunIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import GameAddMenuItems from '@/features/game/components/import/game-add-menu-items'
import { useMobileHeaderMenu } from '@/hooks/use-mobile-header-menu'

export default function MobileHeaderMenu() {
  const { open, setOpen, showNsfw, setShowNsfw, isDark, toggleTheme } = useMobileHeaderMenu()

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-lg" className="md:hidden" aria-label="更多操作">
          <MoreHorizontalIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 max-w-[calc(100vw-24px)]">
        <DropdownMenuLabel>添加游戏</DropdownMenuLabel>
        <GameAddMenuItems compact />
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showNsfw}
          onCheckedChange={setShowNsfw}
          className="min-h-10"
        >
          <EyeIcon />
          显示 NSFW 游戏
        </DropdownMenuCheckboxItem>
        <DropdownMenuItem onSelect={toggleTheme} className="min-h-10">
          {isDark ? <SunIcon /> : <MoonIcon />}
          {isDark ? '切换浅色主题' : '切换深色主题'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
