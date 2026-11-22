import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { getGameSidebarData } from '@/api'
import { gameSearchAtom, showNsfwAtom } from '@/atom/global'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'

export function useGameSidebar() {
  const search = useAtomValue(gameSearchAtom).trim()
  const showNsfw = useAtomValue(showNsfwAtom)
  const group = useAtomValue(gameLibraryGroupAtom)

  return useQuery({
    queryKey: ['game-sidebar', search, showNsfw, group],
    queryFn: () => getGameSidebarData({ search, includeNsfw: showNsfw, group }),
  })
}
