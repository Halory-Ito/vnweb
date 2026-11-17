'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getMetingDetails } from '../ost-api'

import type { OstSongItem } from '@/types'

const fetchNeteaseSongUrl = async (songUrl: string) => {
  const match = songUrl.match(/[?&]id=(\d+)/)
  if (!match) return songUrl
  const details = await getMetingDetails({ server: 'netease', type: 'song', id: match[1] })
  return details.songs[0].url
}

export function useSongPlayer(items: OstSongItem[], resource = 'khinsider') {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items

  const [currentSong, setCurrentSong] = useState<OstSongItem | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolumeState] = useState(0.8)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    setIsPlaying(false)
    setIsBuffering(false)
    setCurrentTime(0)
    setDuration(0)
    setCurrentSong(null)
  }, [])

  const playSong = useCallback(
    async (song: OstSongItem) => {
      if (currentSong?.id === song.id && audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause()
          setIsPlaying(false)
        } else {
          await audioRef.current.play().catch(() => setIsPlaying(false))
          setIsPlaying(true)
        }
        return
      }

      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }

      setCurrentSong(song)
      setCurrentTime(0)
      setDuration(0)
      setIsBuffering(true)

      let url = song.url
      if (resource === 'netease' && song.url.includes('/song/url/v1')) {
        try {
          url = await fetchNeteaseSongUrl(song.url)
        } catch {
          setIsBuffering(false)
          setIsPlaying(false)
          return
        }
      }

      const audio = new Audio(url)
      audio.volume = volume
      audioRef.current = audio

      audio.onloadedmetadata = () => {
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
      }
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime)
      }
      audio.oncanplay = () => {
        setIsBuffering(false)
      }
      audio.onended = () => {
        const list = itemsRef.current
        const idx = list.findIndex((item) => item.id === song.id)
        if (idx >= 0 && idx + 1 < list.length) {
          void playSong(list[idx + 1])
        } else {
          setIsPlaying(false)
        }
      }
      audio.onerror = () => {
        setIsBuffering(false)
        setIsPlaying(false)
      }

      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      } finally {
        setIsBuffering(false)
      }
    },
    [currentSong?.id, isPlaying, resource, volume],
  )

  const playNext = useCallback(() => {
    if (!currentSong || items.length === 0) return
    const idx = items.findIndex((item) => item.id === currentSong.id)
    const next = items[(idx + 1) % items.length]
    if (next) void playSong(next)
  }, [currentSong, items, playSong])

  const playPrev = useCallback(() => {
    if (!currentSong || items.length === 0) return
    const idx = items.findIndex((item) => item.id === currentSong.id)
    const prev = items[(idx - 1 + items.length) % items.length]
    if (prev) void playSong(prev)
  }, [currentSong, items, playSong])

  const seek = useCallback((value: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value
    setCurrentTime(value)
  }, [])

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value))
    setVolumeState(clamped)
    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  return {
    currentSong,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    playSong,
    playNext,
    playPrev,
    seek,
    setVolume,
    stop,
  }
}
