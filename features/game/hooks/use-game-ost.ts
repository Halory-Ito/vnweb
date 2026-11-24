'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { getOstManageList, getOstSongs } from '@/api'
import { useSongPlayer } from '@/features/ost/hooks/use-song-player'

import type { OstSongItem } from '@/types'

export function useGameOst(gameId: number, cover: string, bg?: string) {
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null)
  const [lyricPreviewItem, setLyricPreviewItem] = useState<OstSongItem | null>(null)

  const albums = useQuery({
    queryKey: ['game-ost-albums', gameId],
    queryFn: () => getOstManageList({ gameId }),
  })

  const albumItems = albums.data?.items ?? []
  const effectiveAlbumId = selectedAlbumId ?? (albumItems.length === 1 ? albumItems[0].id : null)
  const album = albumItems.find((item) => item.id === effectiveAlbumId) ?? null
  const activeAlbum = album
    ? { ...album, cover: album.cover || cover, gameBg: album.gameBg || bg || '' }
    : null
  const canGoBack = albumItems.length > 1

  const tracks = useQuery({
    queryKey: ['ost-songs', activeAlbum?.id ?? null],
    queryFn: () => getOstSongs(activeAlbum!.id),
    enabled: Boolean(activeAlbum),
  })

  const items = tracks.data?.items ?? []
  const player = useSongPlayer(items, activeAlbum ?? undefined)
  const isAlbumPlaying = player.isPlaying && items.some((item) => item.id === player.id)

  const playFirst = () => {
    const first = items[0]
    if (first) player.playSong(first)
  }

  const selectAlbum = (id: number) => {
    setLyricPreviewItem(null)
    setSelectedAlbumId(id)
  }

  const backToAlbums = () => {
    setLyricPreviewItem(null)
    setSelectedAlbumId(null)
  }

  return {
    albums,
    albumItems,
    activeAlbum,
    canGoBack,
    tracks,
    items,
    player,
    isAlbumPlaying,
    playFirst,
    lyricPreviewItem,
    setLyricPreviewItem,
    selectAlbum,
    backToAlbums,
  }
}
