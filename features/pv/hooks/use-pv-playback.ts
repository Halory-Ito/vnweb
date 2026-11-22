import { useEffect, useState } from 'react'

import { isHlsUrl, isVideoFileUrl } from '../lib/pv-utils'
import { resolvePvVideoUrl } from '../lib/video-resolver'

type Source = { mode: 'direct' | 'embed'; url: string }
type Playback = { mode: 'loading' } | { mode: 'unavailable' } | Source

export function getPlayableUrl(value: string) {
  try {
    const url = new URL(value, 'https://local.invalid')
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : ''
  } catch {
    return ''
  }
}

export function usePvPlayback(value: string): Playback {
  const url = value.trim()
  const [state, setState] = useState<{ url: string; source: Source | null }>()
  const playableUrl = getPlayableUrl(url)
  const direct = playableUrl && (isVideoFileUrl(url) || isHlsUrl(url))

  useEffect(() => {
    if (!playableUrl || direct) return

    let cancelled = false
    void resolvePvVideoUrl(playableUrl)
      .then((result) => {
        if (cancelled) return

        const embed = result?.embedUrl && getPlayableUrl(result.embedUrl)
        const media = result?.resolvedUrl && getPlayableUrl(result.resolvedUrl)
        setState({
          url,
          source: embed
            ? { mode: 'embed', url: embed }
            : media
              ? { mode: 'direct', url: media }
              : null,
        })
      })
      .catch(() => {
        if (!cancelled) setState({ url, source: null })
      })

    return () => {
      cancelled = true
    }
  }, [direct, playableUrl, url])

  if (direct) return { mode: 'direct', url: playableUrl }
  if (!playableUrl) return { mode: 'unavailable' }
  if (state?.url !== url) return { mode: 'loading' }

  return state.source ?? { mode: 'unavailable' }
}

export function usePvVideo(url: string) {
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!video) return
    video.volume = 0.5
    if (!isHlsUrl(url) || video.canPlayType('application/vnd.apple.mpegurl')) {
      if (/steamstatic\.com|steamcdn-a\.akamaihd\.net|valvesoftware\.com/i.test(url)) {
        video.crossOrigin = 'anonymous'
      }
      video.src = url
      video.load()
      return () => {
        video.pause()
        video.removeAttribute('src')
        video.load()
      }
    }

    let cancelled = false
    let dispose: (() => void) | undefined

    void import('hls.js')
      .then(({ default: Hls }) => {
        if (cancelled) return
        if (!Hls.isSupported()) {
          setHasError(true)
          return
        }

        const hls = new Hls()
        dispose = () => hls.destroy()
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) setHasError(true)
        })
      })
      .catch(() => {
        if (!cancelled) setHasError(true)
      })

    return () => {
      cancelled = true
      dispose?.()
    }
  }, [url, video])

  return { setVideo, hasError, onError: () => setHasError(true) }
}
