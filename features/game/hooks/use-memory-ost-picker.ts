'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { getOstManageList, getOstSongs, getOstSongsByIdsApi } from '@/api'

import type { OstSongItem } from '@/types'

export function useMemoryOstPicker(
  gameId: number,
  selectedSongIds: number[],
  onChange: (ids: number[]) => void,
) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const [scope, setScope] = useState<'game' | 'all'>('game')
  const [selectedAlbumId, setSelectedAlbumId] = useState<number | null>(null)
  const [songKeyword, setSongKeyword] = useState('')
  const [cachedSongNames, setCachedSongNames] = useState<Record<number, string>>({})

  const selectedSongsQuery = useQuery({
    queryKey: ['ost-songs-by-ids', selectedSongIds],
    queryFn: () => getOstSongsByIdsApi(selectedSongIds),
    enabled: selectedSongIds.length > 0,
  })

  const albumsQuery = useQuery({
    queryKey: ['ost-manage-list', scope === 'game' ? gameId : 'all'],
    queryFn: () => getOstManageList(scope === 'game' ? { gameId } : undefined),
    enabled: pickerOpen,
  })

  const albums = useMemo(() => albumsQuery.data?.items ?? [], [albumsQuery.data])

  const activeAlbumId = useMemo(() => {
    if (selectedAlbumId !== null && albums.some((album) => album.id === selectedAlbumId)) {
      return selectedAlbumId
    }
    return albums[0]?.id ?? null
  }, [albums, selectedAlbumId])

  const albumSongsQuery = useQuery({
    queryKey: ['ost-songs', activeAlbumId],
    queryFn: () => getOstSongs(activeAlbumId!),
    enabled: pickerOpen && activeAlbumId !== null,
  })

  const albumSongs = useMemo(() => albumSongsQuery.data?.items ?? [], [albumSongsQuery.data])

  const filteredSongs = useMemo(() => {
    const keyword = songKeyword.trim().toLowerCase()
    if (!keyword) {
      return albumSongs
    }
    return albumSongs.filter((song) => song.name.toLowerCase().includes(keyword))
  }, [albumSongs, songKeyword])

  const songNameById = useMemo(() => {
    const map: Record<number, string> = { ...cachedSongNames }
    for (const song of selectedSongsQuery.data?.items ?? []) {
      map[song.id] = song.name
    }
    for (const song of albumSongs) {
      map[song.id] = song.name
    }
    return map
  }, [cachedSongNames, selectedSongsQuery.data, albumSongs])

  const handleScopeChange = (nextScope: 'game' | 'all') => {
    setScope(nextScope)
    setSelectedAlbumId(null)
    setSongKeyword('')
  }

  const handleAlbumChange = (albumId: number) => {
    setSelectedAlbumId(albumId)
    setSongKeyword('')
  }

  const toggleSong = (song: OstSongItem) => {
    setCachedSongNames((prev) =>
      prev[song.id] === song.name ? prev : { ...prev, [song.id]: song.name },
    )
    if (selectedSongIds.includes(song.id)) {
      onChange(selectedSongIds.filter((id) => id !== song.id))
    } else {
      onChange([...selectedSongIds, song.id])
    }
  }

  const removeSong = (songId: number) => {
    onChange(selectedSongIds.filter((id) => id !== songId))
  }

  const clearSongs = () => {
    onChange([])
  }

  return {
    pickerOpen,
    setPickerOpen,
    scope,
    handleScopeChange,
    albums,
    albumsLoading: albumsQuery.isLoading,
    activeAlbumId,
    handleAlbumChange,
    albumSongs,
    filteredSongs,
    songsLoading: albumSongsQuery.isLoading,
    songKeyword,
    setSongKeyword,
    songNameById,
    toggleSong,
    removeSong,
    clearSongs,
  }
}
