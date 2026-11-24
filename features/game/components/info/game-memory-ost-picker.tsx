'use client'

import { MusicIcon, XIcon } from 'lucide-react'

import { useMemoryOstPicker } from '../../hooks/use-memory-ost-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

type GameMemoryOstPickerProps = {
  gameId: number
  selectedSongIds: number[]
  onChange: (ids: number[]) => void
}

export function GameMemoryOstPicker({
  gameId,
  selectedSongIds,
  onChange,
}: GameMemoryOstPickerProps) {
  const picker = useMemoryOstPicker(gameId, selectedSongIds, onChange)

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label>
          <MusicIcon className="text-muted-foreground size-3.5" />
          配乐曲目
        </Label>

        <div className="flex items-center gap-1.5">
          {selectedSongIds.length > 0 ? (
            <Button type="button" variant="ghost" size="xs" onClick={picker.clearSongs}>
              清空
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => picker.setPickerOpen(!picker.pickerOpen)}
          >
            {picker.pickerOpen ? '收起曲目' : '选择 OST'}
          </Button>
        </div>
      </div>

      {selectedSongIds.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selectedSongIds.map((songId) => (
            <Badge key={songId} variant="outline" className="max-w-full gap-1 pr-1 font-normal">
              <MusicIcon className="size-3 shrink-0" />
              <span className="max-w-52 truncate">
                {picker.songNameById[songId] ?? `曲目 #${songId}`}
              </span>
              <button
                type="button"
                aria-label="移除曲目"
                onClick={() => picker.removeSong(songId)}
                className="text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
              >
                <XIcon className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}

      {picker.pickerOpen ? (
        <div className="border-border/70 space-y-2.5 rounded-lg border p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="xs"
                className={picker.scope === 'game' ? 'bg-accent text-accent-foreground' : undefined}
                onClick={() => picker.handleScopeChange('game')}
              >
                仅本游戏
              </Button>
              <Button
                type="button"
                variant="outline"
                size="xs"
                className={picker.scope === 'all' ? 'bg-accent text-accent-foreground' : undefined}
                onClick={() => picker.handleScopeChange('all')}
              >
                全部 OST
              </Button>
            </div>

            {picker.albums.length > 0 ? (
              <Select
                value={picker.activeAlbumId ? String(picker.activeAlbumId) : ''}
                onValueChange={(value) => picker.handleAlbumChange(Number(value))}
              >
                <SelectTrigger size="sm" className="min-w-44 flex-1" aria-label="选择 OST 专辑">
                  <SelectValue placeholder="选择专辑" />
                </SelectTrigger>
                <SelectContent>
                  {picker.albums.map((album) => (
                    <SelectItem key={album.id} value={String(album.id)}>
                      {album.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          {picker.albumSongs.length > 6 ? (
            <Input
              value={picker.songKeyword}
              onChange={(event) => picker.setSongKeyword(event.target.value)}
              placeholder="筛选曲目..."
              className="h-8 text-xs"
            />
          ) : null}

          <div className="max-h-44 space-y-1 overflow-y-auto">
            {picker.albumsLoading || picker.songsLoading ? (
              <div className="space-y-1.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-7 w-full rounded-md" />
                ))}
              </div>
            ) : picker.albums.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">暂无 OST 专辑</p>
            ) : picker.albumSongs.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">该专辑暂无曲目</p>
            ) : picker.filteredSongs.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-xs">未找到匹配的曲目</p>
            ) : (
              picker.filteredSongs.map((song, index) => {
                const checked = selectedSongIds.includes(song.id)
                return (
                  <label
                    key={song.id}
                    className="hover:bg-accent/50 flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => picker.toggleSong(song)} />
                    <span className="text-muted-foreground w-5 shrink-0 text-xs tabular-nums">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{song.name}</span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
