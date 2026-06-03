'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'

import { GameSidebarItem } from './game-sidebar-item'
import { gameFilterAtom, gameSearchAtom, showNsfwAtom } from '@/atom/global'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getGameSidebarData } from '@/lib/game/game-utils'

export default function GameSidebar() {
  const search = useAtomValue(gameSearchAtom)
  const filter = useAtomValue(gameFilterAtom)
  const showNsfw = useAtomValue(showNsfwAtom)
  const [ctrlPressed, setCtrlPressed] = useState(false)

  const { data } = useQuery({
    queryKey: ['game-sidebar', search, filter, showNsfw],
    queryFn: () =>
      getGameSidebarData({ search, filter, includeNsfw: showNsfw }),
  })

  const items = data?.items ?? []
  const hasActiveFilter = Object.values(filter).some(
    (value) => typeof value === 'string' && value.trim() !== '',
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

  return (
    <Accordion type="multiple" className="w-full min-w-0 overflow-x-hidden">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          value={item.id}
          className="min-w-0 border-none"
        >
          <AccordionTrigger className="min-w-0 cursor-pointer p-2 font-bold hover:no-underline">
            {`${hasActiveFilter && item.id === 'all' ? '筛选结果' : item.title} (${item.items.length})`}
          </AccordionTrigger>
          <AccordionContent className="min-w-0 space-y-2 p-2">
            {item.items.map((subItem) => (
              <GameSidebarItem
                key={subItem.id}
                {...subItem}
                ctrlPressed={ctrlPressed}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
