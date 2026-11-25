import { CircleCheckIcon, Loader2Icon } from 'lucide-react'

import { Pagination } from '@/components/custom-pagination'
import { useGameImagePagination } from '@/features/game/hooks/use-game-image-pagination'
import { cn } from '@/lib/utils'

import type { GameImageType } from '@/lib/game-image-sources'
import type { GameSearchImageItem } from '@/types'

const GRID_COLUMNS_BY_TYPE: Record<GameImageType, string> = {
  cover: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4',
  bg: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  icon: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5',
  logo: 'grid-cols-1 sm:grid-cols-2',
}

const PREVIEW_ASPECT_BY_TYPE: Record<GameImageType, string> = {
  cover: 'aspect-[3/4]',
  bg: 'aspect-video',
  icon: 'aspect-square p-2',
  logo: 'aspect-[16/7] p-3',
}

type GameImageSearchGridProps = {
  imageType: GameImageType
  images: GameSearchImageItem[]
  isSearching: boolean
  selectedUrl: string
  onSelectUrl: (url: string) => void
}

/** 媒体资源搜索结果的可滚动自适应分页网格。 */
export function GameImageSearchGrid({
  imageType,
  images,
  isSearching,
  selectedUrl,
  onSelectUrl,
}: GameImageSearchGridProps) {
  const {
    page,
    pageSize,
    pageSizeOptions,
    total,
    totalPages,
    showPagination,
    pageImages,
    scrollRef,
    changePage,
    changePageSize,
  } = useGameImagePagination(images, imageType)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        ref={scrollRef}
        className="bg-muted/20 min-h-0 flex-1 overflow-y-auto rounded-md border p-2 sm:p-3"
      >
        {images.length === 0 ? (
          <div className="text-muted-foreground flex min-h-40 items-center justify-center gap-2 text-sm">
            {isSearching ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                <span>搜索中...</span>
              </>
            ) : (
              <span>暂无图片，请先执行搜索</span>
            )}
          </div>
        ) : (
          <div className={cn('grid gap-2.5 sm:gap-3', GRID_COLUMNS_BY_TYPE[imageType])}>
            {pageImages.map((item) => {
              const isSelected = selectedUrl === item.url
              const sizeText =
                item.width > 0 && item.height > 0 ? `${item.width}×${item.height}` : ''
              const caption =
                sizeText && item.label
                  ? `${sizeText} · ${item.label}`
                  : sizeText || item.label || '原图'

              return (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'bg-muted/25 hover:bg-muted/45 focus-visible:ring-ring relative flex flex-col overflow-hidden rounded-md border text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    isSelected && 'ring-primary bg-muted/45 ring-2',
                  )}
                  onClick={() => onSelectUrl(item.url)}
                >
                  <div
                    className={cn(
                      'bg-muted/35 w-full overflow-hidden',
                      PREVIEW_ASPECT_BY_TYPE[imageType],
                    )}
                  >
                    <img
                      src={item.thumb || item.url}
                      alt={item.label || `图片 ${item.id}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="bg-background/85 flex w-full items-center justify-between gap-2 px-2 py-1.5 text-xs">
                    <span className="truncate">{caption}</span>
                    {isSelected ? (
                      <CircleCheckIcon className="text-primary size-4 shrink-0" />
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      {showPagination ? (
        <div className="shrink-0">
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            pageSizeOptions={pageSizeOptions}
            itemUnit="张"
            itemName="图片"
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
          />
        </div>
      ) : null}
    </div>
  )
}
