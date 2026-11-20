'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { LyricTrackVisibility } from '../hooks/use-player-lyrics'
import type { LyricTrackKey } from '../lib/parse-lrc'

const TRACK_OPTIONS: { key: LyricTrackKey; label: string; title: string }[] = [
  { key: 'original', label: '原', title: '显示/隐藏原歌词' },
  { key: 'translation', label: '译', title: '显示/隐藏翻译' },
  { key: 'romaji', label: '音', title: '显示/隐藏音译' },
]

type PlayerLyricTrackTogglesProps = {
  tracks: LyricTrackVisibility
  hasTranslation: boolean
  hasRomaji: boolean
  onToggle: (key: LyricTrackKey) => void
  className?: string
}

export function PlayerLyricTrackToggles({
  tracks,
  hasTranslation,
  hasRomaji,
  onToggle,
  className,
}: PlayerLyricTrackTogglesProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {TRACK_OPTIONS.map(({ key, label, title }) => {
        const available =
          key === 'original' ||
          (key === 'translation' && hasTranslation) ||
          (key === 'romaji' && hasRomaji)
        const active = tracks[key] && available
        return (
          <Button
            key={key}
            type="button"
            size="icon-xs"
            variant={active ? 'outline' : 'ghost'}
            disabled={!available}
            aria-pressed={active}
            aria-label={title}
            title={available ? title : `当前歌曲暂无${label === '译' ? '翻译' : '音译'}`}
            onClick={() => onToggle(key)}
            className={cn(
              'rounded-full text-xs font-medium',
              active
                ? 'border-primary/60 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary'
                : 'text-muted-foreground',
            )}
          >
            {label}
          </Button>
        )
      })}
    </div>
  )
}
