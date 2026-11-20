'use client'

import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { nextTrackIndex, type PlayMode } from '../lib/play-mode'
import { getMetingDetails } from '../ost-api'

import type { OstSongItem } from '@/types'

export type PlayerAlbum = {
  name: string
  cover: string
  resource: string
  gameBg?: string
  gameCover?: string
}
type Selection = { items: OstSongItem[]; song: OstSongItem; album?: PlayerAlbum }
const modeAtom = atomWithStorage<PlayMode>('ost-player-mode', 'sequence')
const requestAtom = atom<Selection | null>(null)
const statusAtom = atom({ id: null as number | null, isPlaying: false, isBuffering: false })

export function useSongPlayer(items: OstSongItem[], album?: PlayerAlbum) {
  const status = useAtomValue(statusAtom)
  const request = useSetAtom(requestAtom)
  return { ...status, playSong: (song: OstSongItem) => request({ items, song, album }) }
}

export function useGlobalSongPlayer() {
  const [mode, setMode] = useAtom(modeAtom)
  const request = useAtomValue(requestAtom)
  const setStatus = useSetAtom(statusAtom)
  const audio = useRef<HTMLAudioElement>(null)
  const active = useRef<Selection | null>(null)
  const revision = useRef(0)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [status, updateStatus] = useState({ isPlaying: false, isBuffering: false })
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)
  const lastVolumeRef = useRef(0.8)

  function setVolume(value: number) {
    const clamped = Math.max(0, Math.min(1, value))
    if (clamped > 0) lastVolumeRef.current = clamped
    setVolumeState(clamped)
  }

  function toggleMute() {
    if (volume > 0) {
      lastVolumeRef.current = volume
      setVolumeState(0)
    } else {
      setVolumeState(lastVolumeRef.current > 0 ? lastVolumeRef.current : 0.8)
    }
  }

  useEffect(() => {
    setStatus({ id: selection?.song.id ?? null, ...status })
  }, [selection, status, setStatus])

  async function start(next: Selection) {
    const media = audio.current
    if (!media) return
    const version = ++revision.current
    active.current = next
    setSelection(next)
    media.pause()
    media.removeAttribute('src')
    media.load()
    setTime(0)
    setDuration(0)
    updateStatus({ isPlaying: false, isBuffering: true })
    try {
      let url = next.song.url
      const id = url.match(/[?&]id=(\d+)/)?.[1]
      if (next.album?.resource === 'netease' && url.includes('/song/url/v1') && id) {
        const details = await getMetingDetails({ server: 'netease', type: 'song', id })
        url = details.songs[0]?.url
      }
      if (version !== revision.current) return
      if (!url) throw new Error('Missing source')
      media.src = url
      await media.play()
    } catch {
      if (version !== revision.current) return
      updateStatus({ isPlaying: false, isBuffering: false })
      toast.error('无法播放这首曲目')
    }
  }

  function toggle() {
    const media = audio.current
    if (!media || !active.current) return
    if (!media.getAttribute('src') || media.error) {
      void start(active.current)
    } else if (media.paused) {
      const version = revision.current
      void media.play().catch(() => {
        if (version === revision.current) toast.error('无法播放这首曲目')
      })
    } else {
      media.pause()
    }
  }

  useEffect(() => {
    if (!request) return
    if (active.current?.song.id === request.song.id) toggle()
    else void start(request)
  }, [request])

  useEffect(() => {
    if (audio.current) audio.current.volume = volume
  }, [volume])

  function move(offset: number, ended = false) {
    const current = active.current
    if (!current) return
    const index = current.items.findIndex((item) => item.id === current.song.id)
    const next = nextTrackIndex(mode, index, current.items.length, offset, ended)
    const song = current.items[next]
    if (song) void start({ ...current, song })
  }

  function selectSong(song: OstSongItem) {
    const current = active.current
    if (!current) return
    if (current.song.id === song.id) {
      toggle()
      return
    }
    void start({ ...current, song })
  }
  function sync() {
    const media = audio.current
    if (!media) return
    setTime(media.currentTime)
    setDuration(Number.isFinite(media.duration) ? media.duration : 0)
  }

  function close() {
    ++revision.current
    active.current = null
    const media = audio.current
    media?.pause()
    media?.removeAttribute('src')
    media?.load()
    setSelection(null)
    updateStatus({ isPlaying: false, isBuffering: false })
  }

  const seek = useCallback((value: number) => {
    const media = audio.current
    if (media && Number.isFinite(media.duration) && media.duration > 0) {
      media.currentTime = Math.max(0, Math.min(value, media.duration))
    }
  }, [])

  return {
    mode,
    setMode,
    selection,
    status,
    time,
    duration,
    volume,
    setVolume,
    toggleMute,
    toggle,
    move,
    selectSong,
    close,
    seek,
    mediaProps: {
      ref: audio,
      loop: mode === 'single-loop',
      onTimeUpdate: sync,
      onDurationChange: sync,
      onPlaying: () => updateStatus({ isPlaying: true, isBuffering: false }),
      onWaiting: () => updateStatus({ isPlaying: false, isBuffering: true }),
      onPause: () => updateStatus({ isPlaying: false, isBuffering: false }),
      onEnded: () => {
        updateStatus({ isPlaying: false, isBuffering: false })
        move(1, true)
      },
      onError: () => updateStatus({ isPlaying: false, isBuffering: false }),
    },
  }
}
