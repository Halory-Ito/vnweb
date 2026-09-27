'use client'

import { ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type RankItem = {
  id: string
  cover: string
  title: string
  stat: number
}

export type RankStatsCardProps = {
  title: string
  rankItems: RankItem[]
  unit: string
  previewCount?: number
}

const PAGE_SIZE = 10

function RankRow({ item, rank, unit }: { item: RankItem; rank: number; unit: string }) {
  return (
    <Link
      href={`/game/info/${item.id}`}
      className="hover:bg-accent/50 flex items-center gap-3 rounded-md px-2 py-2 transition-colors"
    >
      <span
        className={cn(
          'w-5 shrink-0 text-right text-sm tabular-nums',
          rank <= 3 ? 'text-foreground font-semibold' : 'text-muted-foreground',
        )}
      >
        {rank}
      </span>

      <div className="bg-muted relative h-11 w-8 shrink-0 overflow-hidden rounded-sm">
        <Image src={item.cover} alt={item.title} fill sizes="32px" className="object-cover" />
      </div>

      <span className="min-w-0 flex-1 truncate text-sm">{item.title}</span>

      <span className="shrink-0 text-sm tabular-nums">
        {item.stat}
        <span className="text-muted-foreground ml-0.5 text-xs">{unit}</span>
      </span>
    </Link>
  )
}

export function RankStatsCard({
  title,
  rankItems = [],
  unit,
  previewCount = 10,
}: RankStatsCardProps) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)

  const topItems = useMemo(
    () => rankItems.slice(0, Math.max(1, previewCount)),
    [previewCount, rankItems],
  )
  const totalPages = Math.max(1, Math.ceil(rankItems.length / PAGE_SIZE))
  const pagedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rankItems.slice(start, start + PAGE_SIZE)
  }, [page, rankItems])

  const openDialog = () => {
    setPage(1)
    setOpen(true)
  }

  return (
    <>
      <Card className="w-full" variant="outline">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          {topItems.length > 0 ? <CardDescription>前 {topItems.length} 名</CardDescription> : null}
          <CardAction>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={rankItems.length === 0}
              onClick={openDialog}
            >
              全部
              <ChevronRightIcon className="size-4" />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="px-4">
          {topItems.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">暂无数据</p>
          ) : (
            <div className="divide-border/50 divide-y">
              {topItems.map((item, index) => (
                <RankRow key={item.id} item={item} rank={index + 1} unit={unit} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {pagedItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">暂无数据</p>
            ) : (
              <div className="divide-border/50 divide-y">
                {pagedItems.map((item, index) => (
                  <RankRow
                    key={`${item.id}-${index}`}
                    item={item}
                    rank={(page - 1) * PAGE_SIZE + index + 1}
                    unit={unit}
                  />
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="items-center justify-between sm:justify-between">
            <span className="text-muted-foreground text-xs">
              第 {page} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                上一页
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                下一页
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
