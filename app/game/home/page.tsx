import { Metadata } from 'next'

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
      ? typeof status === 'string' &&
        /^(?:-1|0|[1-9]\d*)$/.test(status) &&
        Number.isSafeInteger(Number(status))
        ? status
        : undefined
      : typeof folder === 'string'
        ? folder
        : undefined

  return <GameHome groupBy={groupBy} folderKey={folderKey} />
}
