import { useQuery } from '@tanstack/react-query'
import { useAtomValue } from 'jotai'

import { useLibraryFolderLogos } from './use-library-folder-logos'
import { useLibraryFolders } from './use-library-folders'
import { getCollections, getGameCardList } from '@/api'
import { showNsfwAtom } from '@/atom/global'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'

export function useLibraryCategoryNavigation() {
  const includeNsfw = useAtomValue(showNsfwAtom)
  const groupBy = useAtomValue(gameLibraryGroupAtom)
  const logos = useLibraryFolderLogos(true)
  const games = useQuery({
    queryKey: ['game-cards', includeNsfw],
    queryFn: () => getGameCardList({ includeNsfw }),
  })
  const collections = useQuery({ queryKey: ['collections'], queryFn: getCollections })
  const { groupedFolders, customFolders } = useLibraryFolders(
    games.data ?? [],
    collections.data ?? [],
    groupBy,
  )

  return {
    folders: [
      ...groupedFolders.map((folder) => ({
        ...folder,
        localOnly: false,
        logo: folder.canSetLogo ? logos?.[folder.href] : undefined,
      })),
      ...customFolders.map((folder) => ({
        ...folder,
        canSetLogo: true,
        localOnly: true,
        logo: logos?.[folder.href],
      })),
    ],
    isPending: games.isPending || collections.isPending,
  }
}
