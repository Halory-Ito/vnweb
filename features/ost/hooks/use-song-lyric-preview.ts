'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchLyricTextApi } from '../ost-api'

import type { OstSongItem } from '@/types'

const REMOTE_URL_RE = /^https?:\/\//i

export function useSongLyricPreview(item: OstSongItem | null) {
  const inlineText = item?.lyricsText?.trim() ?? ''
  const path = item?.lyricsPath?.trim() ?? ''
  const isRemote = !inlineText && (REMOTE_URL_RE.test(path) || path.startsWith('/api/ost/meting?'))

  const query = useQuery({
    queryKey: ['ost-lyric-preview', path],
    enabled: Boolean(item) && isRemote,
    queryFn: ({ signal }) => fetchLyricTextApi(path, signal),
  })

  const content = inlineText || query.data?.trim() || ''

  return {
    content,
    path,
    isRemote,
    isLoading: isRemote && query.isLoading,
    isError: isRemote && query.isError,
    isFetching: isRemote && query.isFetching,
    refetch: () => void query.refetch(),
  }
}
