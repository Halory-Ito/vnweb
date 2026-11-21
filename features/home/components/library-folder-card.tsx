import { useAtomValue } from 'jotai'
import {
  FolderOpenIcon,
  ImageIcon,
  MoreHorizontalIcon,
  PaletteIcon,
  Trash2Icon,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useLibraryFolderColor } from '../hooks/use-library-folder-color'
import LibraryFolderCover from './library-folder-cover'
import LibraryFolderLogoDialog from './library-folder-logo-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { folderLogosAtom } from '@/lib/settings/game-library-folder-logos'

import type { GameCardsData } from '../views/game-home'

export default function LibraryFolderCard({
  title,
  href,
  games,
  paletteColor,
  canSetLogo,
  onDelete,
}: {
  title: string
  href: string
  games: GameCardsData
  paletteColor?: string
  canSetLogo?: boolean
  onDelete?: () => void
}) {
  const [logoOpen, setLogoOpen] = useState(false)
  const logos = useAtomValue(folderLogosAtom)
  const logo = canSetLogo ? logos[href] : undefined
  const { color: customColor, open, setOpen, setColor, resetColor } = useLibraryFolderColor(href)
  const color = customColor ?? paletteColor

  return (
    <div className="relative min-w-0">
      <Link
        href={href}
        className="group focus-visible:ring-ring block h-full rounded-xl pt-2 outline-none focus-visible:ring-2"
        aria-label={`${title}，${games.length} 个游戏`}
      >
        <span
          aria-hidden
          className="bg-muted absolute top-0 left-0 h-4 w-2/5 rounded-t-lg border-x border-t"
          style={
            color
              ? { backgroundColor: `color-mix(in oklab, ${color} 60%, var(--muted))` }
              : undefined
          }
        />
        <span
          className="bg-background/85 before:bg-foreground/[0.08] relative flex h-full flex-col gap-2 rounded-xl border p-2 group-hover:shadow-md before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 group-hover:before:opacity-100 group-focus-visible:before:opacity-100 motion-safe:transition-shadow motion-safe:duration-150 motion-safe:before:transition-opacity motion-safe:before:duration-150 sm:p-2.5"
          style={
            color
              ? { backgroundColor: `color-mix(in oklab, ${color} 24%, var(--background))` }
              : undefined
          }
        >
          <LibraryFolderCover key={logo} logo={logo} games={games} />
          <span className="flex min-w-0 items-center justify-between gap-1">
            <span className="truncate text-sm font-semibold" title={title}>
              {title}
            </span>
            <span className="text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
              <FolderOpenIcon
                aria-hidden="true"
                className="text-foreground size-3.5 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 motion-safe:transition-opacity motion-safe:duration-150"
              />
              {games.length}
            </span>
          </span>
        </span>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="absolute top-4 right-2"
            aria-label={`管理文件夹：${title}`}
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canSetLogo ? (
            <DropdownMenuItem onSelect={() => setLogoOpen(true)}>
              <ImageIcon /> 设置 LOGO
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => setOpen(true)}>
            <PaletteIcon /> 自定义颜色
          </DropdownMenuItem>
          {onDelete ? (
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2Icon /> 删除文件夹
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
      {logoOpen ? (
        <LibraryFolderLogoDialog
          href={href}
          title={title}
          source={logo}
          onClose={() => setLogoOpen(false)}
        />
      ) : null}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>文件夹颜色</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          <Input
            type="color"
            aria-label="选择文件夹颜色"
            value={color ?? '#64748b'}
            onChange={(event) => setColor(event.target.value)}
            className="h-10 w-24 cursor-pointer p-1"
          />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={!customColor} onClick={resetColor}>
              {paletteColor ? '跟随色板' : '恢复默认色'}
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
