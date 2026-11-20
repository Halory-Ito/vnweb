'use client'

import { ChevronLeft, Disc3, LoaderCircle, Pause, Play } from 'lucide-react'

import { useGameOst } from '../../hooks/use-game-ost'
import { Button } from '@/components/ui/button'

export default function GameOST({
  gameId,
  cover,
  bg,
}: {
  gameId: number
  cover: string
  bg?: string
}) {
  const { albums, album, tracks, items, player, setAlbumId } = useGameOst(gameId, cover, bg)
  const query = album ? tracks : albums

  if (query.isPending)
    return (
      <p role="status" className="text-muted-foreground py-8 text-center text-sm">
        正在加载 OST…
      </p>
    )
  if (query.isError)
    return (
      <div className="space-y-3 py-8 text-center">
        <p role="alert">OST 加载失败</p>
        <Button variant="outline" onClick={() => void query.refetch()}>
          重试
        </Button>
        {album && (
          <Button variant="ghost" onClick={() => setAlbumId(null)}>
            返回专辑
          </Button>
        )}
      </div>
    )

  if (!album)
    return albums.data?.items.length ? (
      <div className="grid grid-cols-2 gap-4 pb-40 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">
        {albums.data.items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAlbumId(item.id)}
            className="group min-w-0 space-y-2 rounded-xl text-sm focus-visible:outline-2"
            title={item.name}
          >
            <div className="bg-muted grid aspect-square place-items-center overflow-hidden rounded-xl border">
              {item.cover || cover ? (
                <img
                  src={item.cover || cover}
                  alt=""
                  className="size-full object-cover group-hover:scale-105 motion-safe:transition-transform"
                />
              ) : (
                <Disc3 />
              )}
            </div>
            <p className="truncate text-center">{item.name}</p>
          </button>
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground py-12 text-center text-sm">暂无 OST 专辑</p>
    )

  return (
    <div className="space-y-3 pb-40">
      <div className="flex min-w-0 items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="返回专辑" onClick={() => setAlbumId(null)}>
          <ChevronLeft />
        </Button>
        <h3 className="truncate font-semibold">{album.name}</h3>
      </div>
      <ul className="divide-y overflow-hidden rounded-xl border">
        {items.map((song, index) => {
          const active = player.id === song.id
          const playing = active && player.isPlaying
          return (
            <li key={song.id}>
              <button
                type="button"
                onClick={() => player.playSong(song)}
                aria-label={`${playing ? '暂停' : '播放'} ${song.name}`}
                className={`hover:bg-muted focus-visible:ring-ring flex min-h-11 w-full items-center gap-3 px-3 py-2 text-left text-sm focus-visible:ring-2 focus-visible:ring-inset ${active ? 'bg-muted font-semibold' : ''}`}
              >
                <span className="text-muted-foreground w-6 shrink-0 text-right tabular-nums">
                  {index + 1}
                </span>
                <span className="flex-1 truncate">{song.name}</span>
                {active && player.isBuffering ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : playing ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
              </button>
            </li>
          )
        })}
        {!items.length && (
          <li className="text-muted-foreground py-8 text-center text-sm">暂无曲目</li>
        )}
      </ul>
    </div>
  )
}
