import { ImageIcon } from 'lucide-react'

import { useOstSearchResults } from '../hooks/use-ost-search-results'
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

import type { UnifiedSearchResult } from '../types'

export function OstSearchResultsDialog({
  results,
  open,
  onOpenChange,
  onSelect,
}: {
  results: UnifiedSearchResult[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (albums: UnifiedSearchResult[]) => void
}) {
  const {
    page,
    pageSize,
    totalPages,
    showPagination,
    pageResults,
    selected,
    scrollRef,
    changePage,
    changePageSize,
    toggleAlbum,
    reset,
  } = useOstSearchResults(results)
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
          <DialogTitle>搜索结果</DialogTitle>
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
            <TableBody>
              {pageResults.map((album) => (
                <TableRow key={`${album.source}-${album.id}`}>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择 ${album.name}`}
                      checked={selected.includes(album)}
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
              ))}
            </TableBody>
          </Table>
        </div>
        {showPagination ? (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={results.length}
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
              close()
              onSelect(results.filter((album) => selected.includes(album)))
            }}
          >
            确认选择（{selected.length}）
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
