import { queryOptions, useQuery } from '@tanstack/react-query'

import { getLibraryFolderLogos } from '../library-folder-logo-api'

export const libraryFolderLogosQuery = queryOptions({
  queryKey: ['library-folder-logos'],
  queryFn: getLibraryFolderLogos,
})

export function useLibraryFolderLogos(enabled: boolean) {
  return useQuery({ ...libraryFolderLogosQuery, enabled }).data
}
