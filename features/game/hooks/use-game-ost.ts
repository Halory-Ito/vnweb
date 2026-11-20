'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getOstManageList, getOstSongs } from '@/api'
import { useSongPlayer } from '@/features/ost/hooks/use-song-player'

export function useGameOst(gameId: number, cover: string, bg?: string) {
  const [albumId, setAlbumId] = useState<number | null>(null)
  const albums = useQuery({
    queryKey: ['game-ost-albums', gameId],
    queryFn: () => getOstManageList({ gameId }),
  })
  const album = albums.data?.items.find((item) => item.id === albumId)
  const tracks = useQuery({
    queryKey: ['ost-songs', albumId],
    queryFn: () => getOstSongs(albumId!),
    enabled: Boolean(album),
  })
  const items = tracks.data?.items ?? []
  const player = useSongPlayer(
    items,
    album && { ...album, cover: album.cover || cover, gameBg: album.gameBg || bg || '' },
  )
  return { albums, album, tracks, items, player, setAlbumId }
}
