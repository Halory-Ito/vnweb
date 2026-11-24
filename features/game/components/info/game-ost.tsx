'use client'

import { Disc3Icon, ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'

import { useGameOst } from '../../hooks/use-game-ost'
import { Button } from '@/components/ui/button'
import { EmptyArtwork } from '@/components/ui/empty-artwork'
import { Skeleton } from '@/components/ui/skeleton'
import { OstAlbumHero } from '@/features/ost/components/ost-album-hero'
import { SongLyricDialog } from '@/features/ost/components/song-lyric-dialog'
import { SongManageContent } from '@/features/ost/components/song-manage-content'

export default function GameOST({
  gameId,
  cover,
  bg,
}: {
  gameId: number
  cover: string
  bg?: string
}) {
  const {
    albums,
    albumItems,
    activeAlbum,
    canGoBack,
    tracks,
    items,
    player,
    isAlbumPlaying,
    playFirst,
    lyricPreviewItem,
    setLyricPreviewItem,
    selectAlbum,
    backToAlbums,
  } = useGameOst(gameId, cover, bg)

  if (albums.isPending) {
    return (
      <div className="@container">
        <div className="grid grid-cols-2 gap-4 pt-2 pb-40 @lg:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2 rounded-xl border p-2.5">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="mx-auto h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (albums.isError) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p role="alert" className="text-sm font-medium">
          OST 加载失败
        </p>
        <Button variant="outline" onClick={() => void albums.refetch()}>
          重试
        </Button>
      </div>
    )
  }

  if (albumItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <EmptyArtwork />
        <p className="text-muted-foreground text-sm">暂无 OST 专辑</p>
        <Button asChild variant="outline" size="sm" className="rounded-full">
          <Link href="/ost">前往 OST 唱片架</Link>
        </Button>
      </div>
    )
  }

  if (!activeAlbum) {
    return (
      <div className="@container">
        <div className="grid grid-cols-2 gap-4 pt-2 pb-40 @lg:grid-cols-3 @2xl:grid-cols-4 @4xl:grid-cols-5">
          {albumItems.map((item) => {
            const albumCover = item.cover || cover
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectAlbum(item.id)}
                className="group bg-muted/20 hover:border-primary/40 hover:bg-muted/35 min-w-0 space-y-2 rounded-xl border p-2.5 text-sm transition-all focus-visible:outline-2"
                title={item.name}
              >
                <div className="bg-muted/40 grid aspect-square place-items-center overflow-hidden rounded-lg">
                  {albumCover ? (
                    <img
                      src={albumCover}
                      alt=""
                      className="size-full object-cover group-hover:scale-105 motion-safe:transition-transform"
                    />
                  ) : (
                    <Disc3Icon className="text-muted-foreground/50 size-8" />
                  )}
                </div>
                <p className="truncate text-center">{item.name}</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-2 pb-40">
      <OstAlbumHero
        ostId={activeAlbum.id}
        ostItem={activeAlbum}
        songCount={items.length}
        isPlaying={isAlbumPlaying}
        onPlayAll={playFirst}
        showBackButton={canGoBack}
        backLabel="返回专辑列表"
        onBack={backToAlbums}
        showGameBadge={false}
        enableSharedLayout={false}
        actions={
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href={`/ost/${activeAlbum.id}`}>
              <ExternalLinkIcon className="size-3.5" />
              管理曲目
            </Link>
          </Button>
        }
      />

      {tracks.isError ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center">
          <p role="alert" className="text-sm font-medium">
            曲目加载失败
          </p>
          <Button variant="outline" size="sm" onClick={() => void tracks.refetch()}>
            重试
          </Button>
        </div>
      ) : (
        <SongManageContent
          items={items}
          isLoading={tracks.isPending}
          isRefetching={tracks.isRefetching && !tracks.isPending}
          playingSongId={player.id}
          isPlaying={player.isPlaying}
          isBuffering={player.isBuffering}
          onPlay={(item) => player.playSong(item)}
          onPreviewLyric={setLyricPreviewItem}
          emptyTitle="暂无曲目"
          emptyHint={null}
        />
      )}

      <SongLyricDialog
        item={lyricPreviewItem}
        onOpenChange={(open) => {
          if (!open) setLyricPreviewItem(null)
        }}
      />
    </div>
  )
}
