export type PlayMode = 'sequence' | 'list-loop' | 'single-loop' | 'shuffle'

export const PLAY_MODE_ORDER: PlayMode[] = ['sequence', 'list-loop', 'single-loop', 'shuffle']

export const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  sequence: '顺序播放',
  'list-loop': '列表循环',
  'single-loop': '单曲循环',
  shuffle: '随机播放',
}

export function nextPlayMode(mode: PlayMode): PlayMode {
  const index = PLAY_MODE_ORDER.indexOf(mode)
  return PLAY_MODE_ORDER[(index + 1) % PLAY_MODE_ORDER.length]
}

export function formatPlayerTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

export function nextTrackIndex(
  mode: PlayMode,
  current: number,
  count: number,
  offset: number,
  ended: boolean,
) {
  if (count === 0 || current < 0) return -1
  if (mode === 'shuffle' && count > 1) {
    const index = Math.floor(Math.random() * (count - 1))
    return index >= current ? index + 1 : index
  }
  const next = current + offset
  if (!ended || mode === 'list-loop') return (next + count) % count
  return next < count ? next : -1
}
