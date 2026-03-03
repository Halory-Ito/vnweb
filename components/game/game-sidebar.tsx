import { desc, eq } from 'drizzle-orm'

import { GameSidebarItem } from './game-sidebar-item'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { CollectionGameTable, CollectionTable, GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { GameSidebarProps } from '@/types/game-types'

const DEFAULT_GAME_ICON = '/file.svg'

export default async function GameSidebar() {
  const allGames = await db
    .select({
      id: GameInfoTable.id,
      name: GameInfoTable.name,
      icon: GameInfoTable.icon,
    })
    .from(GameInfoTable)
    .orderBy(desc(GameInfoTable.id))

  const collections = await db
    .select({
      id: CollectionTable.id,
      name: CollectionTable.name,
    })
    .from(CollectionTable)
    .orderBy(desc(CollectionTable.id))

  const collectionGameRows = await db
    .select({
      collectionId: CollectionGameTable.collectionId,
      gameId: GameInfoTable.id,
      gameName: GameInfoTable.name,
      gameIcon: GameInfoTable.icon,
    })
    .from(CollectionGameTable)
    .innerJoin(GameInfoTable, eq(CollectionGameTable.gameId, GameInfoTable.id))
    .orderBy(desc(CollectionGameTable.id))

  const collectionGameMap = new Map<
    number,
    Array<{ id: string; title: string; icon: string }>
  >()

  for (const row of collectionGameRows) {
    const current = collectionGameMap.get(row.collectionId) ?? []
    current.push({
      id: String(row.gameId),
      title: row.gameName,
      icon: row.gameIcon?.trim() ? row.gameIcon : DEFAULT_GAME_ICON,
    })
    collectionGameMap.set(row.collectionId, current)
  }

  const items: GameSidebarProps[] = [
    {
      id: 'recent',
      title: '最近游戏',
      items: [],
    },
    {
      id: 'all',
      title: '所有游戏',
      items: allGames.map((game) => ({
        id: String(game.id),
        title: game.name,
        icon: game.icon?.trim() ? game.icon : DEFAULT_GAME_ICON,
      })),
    },
    ...collections.map((collection) => ({
      id: `collection-${collection.id}`,
      title: collection.name,
      items: collectionGameMap.get(collection.id) ?? [],
    })),
  ]

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
