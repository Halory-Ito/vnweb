import { Metadata } from 'next'

import { GAME_PLAY_STATUS_OPTIONS } from '@/features/game/lib/game-status'
import { getLibraryGroup } from '@/features/home/lib/library-grouping'
import GameHome from '@/features/home/views/game-home'

export const metadata: Metadata = {
  title: '游戏库',
  description: '游戏主页',
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    group?: string | string[]
    status?: string | string[]
    folder?: string | string[]
  }>
}) {
  const { group, status, folder } = await searchParams
  const groupBy = getLibraryGroup(group)
  const folderKey =
    groupBy === 'status'
      ? GAME_PLAY_STATUS_OPTIONS.map(String).find((value) => value === status)
      : typeof folder === 'string'
        ? folder
        : undefined

  return <GameHome groupBy={groupBy} folderKey={folderKey} />
}
