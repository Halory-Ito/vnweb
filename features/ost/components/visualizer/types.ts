import type { LyricTrackVisibility } from '../../hooks/use-player-lyrics'
import type { PlayerAlbum } from '../../hooks/use-song-player'
import type { LrcCue } from '../../lib/parse-lrc'

export type VisualizerStageProps = {
  songId: number
  songName: string
  album?: PlayerAlbum
  cues: LrcCue[]
  activeIndex: number
  lineProgress: number
  duration: number
  isPlaying: boolean
  tracks: LyricTrackVisibility
  onSeek: (time: number) => void
}

export function resolveCueTracks(cue: LrcCue, tracks: LyricTrackVisibility) {
  const hasRomaji = tracks.romaji && Boolean(cue.romaji)
  const hasTranslation = tracks.translation && Boolean(cue.translation)
  const renderOriginal = tracks.original || (!hasRomaji && !hasTranslation)
  return { hasRomaji, hasTranslation, renderOriginal }
}

export function getNeighborCueText(cue: LrcCue, tracks: LyricTrackVisibility): string {
  if (tracks.original) return cue.original
  if (tracks.translation && cue.translation) return cue.translation
  if (tracks.romaji && cue.romaji) return cue.romaji
  return cue.original
}
