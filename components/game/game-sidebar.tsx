'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { GameSidebarItem } from './game-sidebar-item'
import { gameFilterAtom, gameSearchAtom } from '@/atom/global'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { getGameSidebarData } from '@/lib/game-utils'

export default function GameSidebar() {
  const search = useAtomValue(gameSearchAtom)
  const filter = useAtomValue(gameFilterAtom)

  const { data } = useQuery({
    queryKey: ['game-sidebar', search, filter],
    queryFn: () => getGameSidebarData({ search, filter }),
  })

  const items = data?.items ?? []

  return (
    <Accordion type="multiple" className="w-full">
      {items.map((item) => (
        <AccordionItem key={item.id} value={item.id} className="border-none">
          <AccordionTrigger className="cursor-pointer p-2 font-bold hover:no-underline">
            {`${item.title} (${item.items.length})`}
          </AccordionTrigger>
          <AccordionContent className="space-y-2 p-2">
            {item.items.map((subItem) => (
              <GameSidebarItem key={subItem.id} {...subItem} />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
