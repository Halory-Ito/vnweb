'use client'

import { usePathname } from 'next/navigation'
import { memo, useEffect, useState } from 'react'

import { useGameSidebar } from '../hooks/use-game-sidebar'
import { GameSidebarItem } from './game-sidebar-item'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import LibraryCategoryIcon from '@/features/home/components/library-category-icon'
import LibraryFolderContextMenu from '@/features/home/components/library-folder-context-menu'
import LibraryFolderLogoDialog from '@/features/home/components/library-folder-logo-dialog'
import { useLibraryFolderLogos } from '@/features/home/hooks/use-library-folder-logos'

type GameSidebarContentProps = ReturnType<typeof useGameSidebar> & {
  onCreateCollection?: () => void
}

export function GameSidebarContent(props: GameSidebarContentProps) {
  const pathname = usePathname()
  const [, section, subsection, gameId] = pathname.split('/')
  const activeGameId = section === 'game' && subsection === 'info' ? gameId : undefined

  return <GameSidebarGroups {...props} activeGameId={activeGameId} />
}

const GameSidebarGroups = memo(function GameSidebarGroups({
  activeGameId,
  data,
  isPending,
  isError,
  refetch,
  onCreateCollection,
}: GameSidebarContentProps & { activeGameId?: string }) {
  const [ctrlPressed, setCtrlPressed] = useState(false)
  const [logoFolderHref, setLogoFolderHref] = useState<string>()
  const items = data?.items ?? []
  const logos = useLibraryFolderLogos(items.some(({ logoTarget }) => Boolean(logoTarget)))
  const logoFolder = items.find(
    ({ logoTarget }) => logoTarget && logoTarget.href === logoFolderHref,
  )

  useEffect(() => {
    const syncModifierState = (event: KeyboardEvent) => {
      setCtrlPressed(event.ctrlKey || event.metaKey)
    }

    const handleWindowBlur = () => {
      setCtrlPressed(false)
    }

    window.addEventListener('keydown', syncModifierState)
    window.addEventListener('keyup', syncModifierState)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      window.removeEventListener('keydown', syncModifierState)
      window.removeEventListener('keyup', syncModifierState)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [])

  if (isPending) return <p className="text-muted-foreground p-3 text-sm">正在加载游戏…</p>
  if (isError)
    return (
      <Button className="m-3" variant="outline" onClick={() => void refetch()}>
        重试加载游戏
      </Button>
    )
  if (!items.length || (data?.mode === 'search' && !items[0]?.items.length)) {
    return <p className="text-muted-foreground p-3 text-sm">没有符合条件的游戏</p>
  }

  return (
    <Accordion
      key={data?.mode}
      type="multiple"
      defaultValue={data?.mode === 'search' ? ['search-results'] : undefined}
      className="w-full min-w-0 overflow-x-hidden p-2"
    >
      {items.map((item) => {
        const href = item.logoTarget?.href
        const logo = href ? logos?.[href] : undefined
        const trigger = (
          <AccordionTrigger className="min-w-0 cursor-pointer p-2 font-bold hover:no-underline">
            <span className="flex min-w-0 items-center gap-2">
              {href ? <LibraryCategoryIcon key={logo} logo={logo} /> : null}
              <span className="truncate">{`${item.title} (${item.items.length})`}</span>
            </span>
          </AccordionTrigger>
        )

        return (
          <AccordionItem key={item.id} value={item.id} className="min-w-0 border-none">
            {href || onCreateCollection ? (
              <LibraryFolderContextMenu
                onEdit={href ? () => setLogoFolderHref(href) : undefined}
                onCreate={onCreateCollection}
              >
                {trigger}
              </LibraryFolderContextMenu>
            ) : (
              trigger
            )}
            <AccordionContent className="min-w-0 space-y-2 p-2">
              {item.items.map((subItem) => (
                <GameSidebarItem
                  key={subItem.id}
                  {...subItem}
                  isActive={subItem.id === activeGameId}
                  ctrlPressed={ctrlPressed}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        )
      })}
      {logoFolder?.logoTarget ? (
        <LibraryFolderLogoDialog
          key={logoFolder.logoTarget.href}
          href={logoFolder.logoTarget.href}
          title={logoFolder.title}
          source={logos?.[logoFolder.logoTarget.href]}
          localOnly={logoFolder.logoTarget.localOnly}
          onClose={() => setLogoFolderHref(undefined)}
        />
      ) : null}
    </Accordion>
  )
})

export default function GameSidebar() {
  const query = useGameSidebar()
  return <GameSidebarContent {...query} />
}
