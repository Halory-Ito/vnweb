import { eq } from 'drizzle-orm'
import type { Metadata } from 'next'

import { GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

import GameInfoPage from './game-info-page'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  try {
    const gameId = Number(id)
    if (!Number.isInteger(gameId) || gameId <= 0) {
      return { title: '游戏详情' }
    }

    const rows = await db
      .select({
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
      })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    const game = rows[0]
    if (!game) {
      return { title: '游戏未找到' }
    }

    const title = game.nameCn || game.name
    return { title }
  } catch {
    return { title: '游戏详情' }
  }
}

export default function Page() {
  return <GameInfoPage />
}
