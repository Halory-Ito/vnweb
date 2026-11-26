import { ImageIcon, Loader2Icon } from 'lucide-react'

import { type OstSearchSession, useOstSearchResults } from '../hooks/use-ost-search-results'
import { Pagination } from '@/components/custom-pagination'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import type { UnifiedSearchResult } from '../types'

export function OstSearchResultsDialog({
  session,
  open,
  onOpenChange,
  onSelect,
}: {
  session: OstSearchSession
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (albums: UnifiedSearchResult[]) => void
}) {
  const {
    page,
    pageSize,
    total,
    totalPages,
    showPagination,
    pageResults,
    isFetching,
    isError,
    retry,
    selected,
    isSelected,
    scrollRef,
    changePage,
    changePageSize,
    toggleAlbum,
    reset,
  } = useOstSearchResults(session, open)
  const close = () => {
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(value) : close())}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85dvh] flex-col overflow-hidden p-4 sm:max-w-2xl sm:p-6"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>搜索结果</span>
            {isFetching ? (
              <Loader2Icon
                className="text-muted-foreground size-4 animate-spin"
                aria-label="加载中"
              />
            ) : null}
          </DialogTitle>
        </DialogHeader>
        <div ref={scrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">选择</TableHead>
                <TableHead className="w-14 sm:w-16">封面</TableHead>
                <TableHead>专辑名称</TableHead>
                <TableHead className="w-1/4 sm:w-1/3">艺术家</TableHead>
                <TableHead className="w-16 text-right">曲目数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn(isFetching && 'opacity-60 transition-opacity')}>
              {isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="text-muted-foreground text-sm">加载搜索结果失败</span>
                      <Button type="button" variant="outline" size="sm" onClick={retry}>
                        重试
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : pageResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground py-8 text-center text-sm">
                    当前页暂无更多专辑
                  </TableCell>
                </TableRow>
              ) : (
                pageResults.map((album) => (
                  <TableRow key={`${album.source}-${album.id}`}>
                    <TableCell>
                      <Checkbox
                        aria-label={`选择 ${album.name}`}
                        checked={isSelected(album)}
                        onCheckedChange={(checked) => toggleAlbum(album, checked === true)}
                      />
                    </TableCell>
                    <TableCell>
                      {album.cover ? (
                        <img
                          src={album.cover}
                          alt={album.name}
                          className="size-10 rounded-md border object-cover sm:size-12"
                        />
                      ) : (
                        <ImageIcon className="text-muted-foreground size-5" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="truncate" title={album.name}>
                        {album.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="truncate" title={album.artist}>
                        {album.artist || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{album.songCount ?? '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {showPagination ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            itemUnit="张"
            itemName="专辑"
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
          />
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            取消
          </Button>
          <Button
            disabled={!selected.length}
            onClick={() => {
              const picked = selected
              close()
              onSelect(picked)
            }}
          >
            确认选择（{selected.length}）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
