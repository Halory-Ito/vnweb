import { useSetAtom } from 'jotai'
import { useRouter, useSelectedLayoutSegment } from 'next/navigation'

import { gameSearchAtom } from '@/atom/global'

const GAME_INFO_TABS = ['overview', 'characters', 'pv', 'ost', 'record', 'memory', 'quote', 'guide']

export function useGameInfoTabs(gameId: number) {
  const segment = useSelectedLayoutSegment()
  const router = useRouter()
  const setGameSearch = useSetAtom(gameSearchAtom)
  const currentTab = segment && GAME_INFO_TABS.includes(segment) ? segment : 'overview'

  const handleTabChange = (value: string) => {
    if (!GAME_INFO_TABS.includes(value) || value === currentTab) return
    router.push(`/game/info/${gameId}/${value}`)
  }

  const searchGame = (value: string) => {
    setGameSearch(value)
    router.push('/game/home')
  }

  return { currentTab, handleTabChange, searchGame }
}
