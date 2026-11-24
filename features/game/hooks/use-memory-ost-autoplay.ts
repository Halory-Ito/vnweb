'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef } from 'react'

import { getOstSongsByIdsApi } from '@/api'
import { type PlayerAlbum, useSongPlayer } from '@/features/ost/hooks/use-song-player'
import { useMemoryMetadataSettings } from '@/hooks/use-memory-metadata-settings'

import type { OstSongItem } from '@/types'

export function useMemoryOstAutoPlay({
  memoryId,
  ostSongIds,
}: {
  memoryId: number
  ostSongIds: number[]
}) {
  const { playback, isFetched: isSettingsFetched } = useMemoryMetadataSettings()
  const songsQuery = useQuery({
    queryKey: ['ost-songs-by-ids', ostSongIds],
    queryFn: () => getOstSongsByIdsApi(ostSongIds),
    enabled: ostSongIds.length > 0,
  })

  const songs = useMemo(() => songsQuery.data?.items ?? [], [songsQuery.data])

  const albumsByOstId = useMemo<Record<number, PlayerAlbum>>(() => {
    const albums = songsQuery.data?.albums ?? {}
    const mapped: Record<number, PlayerAlbum> = {}
    for (const [ostId, album] of Object.entries(albums)) {
      mapped[Number(ostId)] = {
        name: album.name,
        cover: album.cover,
        resource: album.resource,
      }
    }
    return mapped
  }, [songsQuery.data])

  const defaultAlbum = songs[0] ? albumsByOstId[songs[0].ostId] : undefined
  const {
    id: activeSongId,
    isPlaying,
    isBuffering,
    playPlaylist,
    stopIfPlayingIds,
  } = useSongPlayer(songs, defaultAlbum)

  const playerBusyRef = useRef(false)
  playerBusyRef.current = isPlaying || isBuffering

  const autoPlayedKeyRef = useRef('')
  const leaveStateRef = useRef({
    stopOnLeave: playback.stopOnLeave,
    songIds: ostSongIds,
    stopIfPlayingIds,
  })
  leaveStateRef.current = {
    stopOnLeave: playback.stopOnLeave,
    songIds: ostSongIds,
    stopIfPlayingIds,
  }

  const songKey = useMemo(() => songs.map((song) => song.id).join(','), [songs])

  useEffect(() => {
    if (
      memoryId <= 0 ||
      !isSettingsFetched ||
      !songsQuery.isFetched ||
      songs.length === 0 ||
      !songKey
    ) {
      return
    }

    const triggerKey = `${memoryId}:${songKey}`
    if (autoPlayedKeyRef.current === triggerKey) {
      return
    }
    autoPlayedKeyRef.current = triggerKey

    if (!playback.autoPlayOnEnter) {
      return
    }
    if (!playback.interruptCurrentPlayback && playerBusyRef.current) {
      return
    }

    const startIndex =
      playback.playMode === 'shuffle' && songs.length > 1
        ? Math.floor(Math.random() * songs.length)
        : 0
    const firstTrack = songs[startIndex] ?? songs[0]

    playPlaylist(songs, firstTrack, {
      album: albumsByOstId[firstTrack.ostId],
      albumsByOstId,
      mode: playback.playMode === 'inherit' ? undefined : playback.playMode,
      forcePlay: true,
      silentAutoPlayError: true,
    })
  }, [
    memoryId,
    isSettingsFetched,
    songsQuery.isFetched,
    songs,
    songKey,
    albumsByOstId,
    playback.autoPlayOnEnter,
    playback.interruptCurrentPlayback,
    playback.playMode,
    playPlaylist,
  ])

  useEffect(() => {
    return () => {
      const current = leaveStateRef.current
      if (current.stopOnLeave && current.songIds.length > 0) {
        current.stopIfPlayingIds(current.songIds)
      }
    }
  }, [memoryId])

  const preferredMode = playback.playMode === 'inherit' ? undefined : playback.playMode

  const playTrack = useCallback(
    (song: OstSongItem) => {
      playPlaylist(songs, song, {
        album: albumsByOstId[song.ostId],
        albumsByOstId,
        mode: preferredMode,
      })
    },
    [playPlaylist, songs, albumsByOstId, preferredMode],
  )

  const togglePlayAll = useCallback(() => {
    if (songs.length === 0) {
      return
    }
    const target = songs.find((song) => song.id === activeSongId) ?? songs[0]
    playTrack(target)
  }, [songs, activeSongId, playTrack])

  const isMemoryPlaying = Boolean(
    activeSongId && (isPlaying || isBuffering) && songs.some((song) => song.id === activeSongId),
  )

  return {
    songs,
    activeSongId,
    isPlaying,
    isBuffering,
    isMemoryPlaying,
    playTrack,
    togglePlayAll,
  }
}
