import { MusicIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

import type { UnifiedAlbumDetails } from '../types'

export function OstAlbumPreview({
  albumDetails,
  onReset,
}: {
  albumDetails: UnifiedAlbumDetails
  onReset: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>专辑曲目</Label>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            重新搜索
          </Button>
        </div>
      </div>

      {/* Album Info */}
      <div className="bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
        {albumDetails.cover ? (
          <img
            src={albumDetails.cover}
            alt={albumDetails.name}
            className="size-12 rounded-md object-cover"
          />
        ) : (
          <div className="bg-secondary flex size-12 items-center justify-center rounded-md">
            <MusicIcon className="text-muted-foreground size-5" />
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium break-words">{albumDetails.name}</p>
          <p className="text-muted-foreground text-sm">{albumDetails.songs.length} 首歌曲</p>
        </div>
      </div>

      {/* Songs List */}
      <div className="bg-muted/50 max-h-72 overflow-y-auto rounded-lg border">
        {albumDetails.songs.map((song, idx) => (
          <div
            key={`${song.url}-${idx}`}
            className="flex w-full items-center gap-3 border-b p-3 text-left last:border-b-0"
          >
            <span className="text-muted-foreground w-8 text-sm">{idx + 1}</span>
            <span className="flex-1 truncate">
              {song.name}
              {song.alias && (
                <span className="text-muted-foreground ml-1 text-xs">({song.alias})</span>
              )}
            </span>
            {song.duration && (
              <span className="text-muted-foreground text-sm">{song.duration}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
