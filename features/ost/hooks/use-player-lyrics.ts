'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useMemo, useRef } from 'react'

import { findActiveCueIndex, parseLrc, type LyricTrackKey } from '../lib/parse-lrc'
import { fetchLyricTextApi } from '../ost-api'

import type { OstSongItem } from '@/types'

export type LyricTrackVisibility = Record<LyricTrackKey, boolean>

const lyricTracksAtom = atomWithStorage<LyricTrackVisibility>('ost-player-lyric-tracks', {
  original: true,
  translation: true,
  romaji: false,
})

export function usePlayerLyrics(song: OstSongItem, time: number) {
  const [tracks, setTracks] = useAtom(lyricTracksAtom)
  const inline = song.lyricsText?.trim()
  const path = song.lyricsPath?.trim()
  const file = useQuery({
    queryKey: ['ost-player-lyrics', path],
    enabled: !inline && Boolean(path),
    queryFn: ({ signal }) => fetchLyricTextApi(path!, signal),
  })
  const text = inline || file.data || ''
  const parsed = useMemo(() => parseLrc(text), [text])
  const active = useMemo(() => findActiveCueIndex(parsed.cues, time), [parsed.cues, time])
  const viewport = useRef<HTMLDivElement>(null)
  const current = useRef<HTMLButtonElement>(null)

  const toggleTrack = (key: LyricTrackKey) => {
    setTracks((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // 至少保留一种歌词轨道处于显示状态
      if (!next.original && !next.translation && !next.romaji) {
        return prev
      }
      return next
    })
  }

  useEffect(() => {
    const panel = viewport.current
    const row = current.current
    if (!panel) return
    const targetTop = row
      ? Math.max(0, row.offsetTop - (panel.clientHeight - row.offsetHeight) / 2)
      : 0
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    panel.scrollTo({
      top: targetTop,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [active, text])

  return {
    text,
    cues: parsed.cues,
    hasTranslation: parsed.hasTranslation,
    hasRomaji: parsed.hasRomaji,
    tracks,
    toggleTrack,
    active,
    viewport,
    current,
    loading: file.isLoading,
    error: file.isError,
  }
}
