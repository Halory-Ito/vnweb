import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  const [selected, setSelected] = useState<UnifiedSearchResult[]>([])
  const close = () => {
    setSelected([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(value) => (value ? onOpenChange(value) : close())}>
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>搜索结果</DialogTitle>
          <DialogDescription>共找到 {results.length} 张专辑，请选择要添加的专辑</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">选择</TableHead>
                <TableHead className="w-20">封面</TableHead>
                <TableHead>专辑名称</TableHead>
                <TableHead>艺术家</TableHead>
                <TableHead>曲目数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((album) => (
                <TableRow key={`${album.source}-${album.id}`}>
                  <TableCell>
                    <Checkbox
                      aria-label={`选择 ${album.name}`}
                      checked={selected.includes(album)}
                      onCheckedChange={(checked) =>
                        setSelected((previous) =>
                          checked === true
                            ? [...previous, album]
                            : previous.filter((item) => item !== album),
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {album.cover ? (
                      <img
                        src={album.cover}
                        alt={album.name}
                        className="size-12 rounded-md border object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-muted-foreground size-5" />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-48 truncate sm:max-w-100" title={album.name}>
                      {album.name}
                    </div>
                  </TableCell>
                  <TableCell>{album.artist || '-'}</TableCell>
                  <TableCell>{album.songCount ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
