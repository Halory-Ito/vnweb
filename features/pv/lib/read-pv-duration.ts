import { isHlsUrl, isSteamVideoUrl, isVideoFileUrl, isVideoStreamUrl } from './pv-utils'
import { resolvePvVideoUrl } from './video-resolver'

export function readPvDuration(url: string, timeoutMs = 5000): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    let settled = false
    let disposeStream: (() => void) | undefined
    const timeout = setTimeout(() => finish(null), timeoutMs)

    function finish(duration: number | null) {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      disposeStream?.()
      video.onloadedmetadata = null
      video.ondurationchange = null
      video.onerror = null
      video.removeAttribute('src')
      video.load()
      resolve(duration)
    }

    function readMetadata() {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        finish(Math.max(1, Math.round(video.duration)))
      }
    }

    async function load() {
      const direct = isVideoFileUrl(url) || isVideoStreamUrl(url) || isSteamVideoUrl(url)
      const source = direct ? null : await resolvePvVideoUrl(url)
      if (settled) return

      if (source?.embedUrl && !source.resolvedUrl) {
        finish(null)
        return
      }

      const mediaUrl = source?.resolvedUrl || url
      const parsed = new URL(mediaUrl, window.location.href)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        finish(null)
        return
      }

      video.onloadedmetadata = readMetadata
      video.ondurationchange = readMetadata
      video.onerror = () => finish(null)

      if (!isHlsUrl(mediaUrl) || video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = parsed.href
        return
      }

      const { default: Hls } = await import('hls.js')
      if (settled) return
      if (!Hls.isSupported()) {
        finish(null)
        return
      }

      const hls = new Hls({ autoStartLoad: false })
      disposeStream = () => hls.destroy()
      hls.on(Hls.Events.MANIFEST_PARSED, () => hls.startLoad())
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) finish(null)
      })
      hls.loadSource(parsed.href)
      hls.attachMedia(video)
    }

    void load().catch(() => finish(null))
  })
}
