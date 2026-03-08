'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { Button } from '../ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

export type StatsCardProps = {
  title: string
  icon: React.ReactNode
  value: string | number
  unit?: string
}

export const SimpleStatsCard = ({
  title,
  icon,
  value,
  unit,
}: StatsCardProps) => {
  return (
    <Card className="w-full" variant="outline">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>{icon}</CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-x-1 text-2xl">
          <span>{value}</span>
          <span>{unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export type ChartStatsCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

export const ChartStatsCard = ({
  title,
  description,
  children,
}: ChartStatsCardProps) => {
  return (
    <Card className="w-full" variant="outline">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

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

export const RankStatsCard = ({
  title,
  rankItems = [],
  unit,
  previewCount = 10,
}: RankStatsCardProps) => {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const topItems = useMemo(
    () => rankItems.slice(0, Math.max(1, previewCount)),
    [previewCount, rankItems],
  )
  const totalPages = Math.max(1, Math.ceil(rankItems.length / pageSize))
  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize
    return rankItems.slice(start, start + pageSize)
  }, [page, rankItems])

  const openDialog = () => {
    setPage(1)
    setOpen(true)
  }

  return (
    <>
      <Card className="w-full" variant="outline">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>仅展示前 {previewCount} 条</CardDescription>
        </CardHeader>
        <CardContent>
          {topItems.map((item, idx) => (
            <Item
              key={item.id}
              className="p-2"
              variant="default"
              size="sm"
              asChild
            >
              <Link href={`/game/info/${item.id}`}>
                <ItemMedia>
                  <div className="bg-background text-foreground dark:border-input dark:bg-input/30 flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold shadow-xs">
                    <span>{idx + 1}</span>
                  </div>
                </ItemMedia>
                <ItemMedia>
                  <div className="relative h-12 w-10">
                    <Image
                      className="rounded-sm object-cover"
                      alt="img"
                      src={item.cover}
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="block max-w-64 truncate font-bold sm:max-w-24 md:max-w-42 lg:max-w-72 xl:max-w-96 2xl:max-w-108">
                    {item.title}
                  </ItemTitle>
                </ItemContent>
                <ItemActions>
                  {item.stat} {unit}
                </ItemActions>
              </Link>
            </Item>
          ))}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={openDialog}
            variant="link"
            disabled={rankItems.length === 0}
          >
            查看全部
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {pagedItems.length === 0 ? (
              <div className="text-muted-foreground rounded-md border p-4 text-sm">
                暂无数据
              </div>
            ) : (
              pagedItems.map((item, idx) => {
                const rankNo = (page - 1) * pageSize + idx + 1
                return (
                  <Item
                    key={`${item.id}-${rankNo}`}
                    className="p-2"
                    variant="default"
                    size="sm"
                    asChild
                  >
                    <Link href={`/game/info/${item.id}`}>
                      <ItemMedia>
                        <div className="bg-background text-foreground dark:border-input dark:bg-input/30 flex h-10 w-10 items-center justify-center rounded-full border text-lg font-bold shadow-xs">
                          <span>{rankNo}</span>
                        </div>
                      </ItemMedia>
                      <ItemMedia>
                        <div className="relative h-12 w-10">
                          <Image
                            className="rounded-sm object-cover"
                            alt="img"
                            src={item.cover}
                            fill
                            style={{ objectFit: 'cover' }}
                          />
                        </div>
                      </ItemMedia>
                      <ItemContent>
                        <ItemTitle className="block max-w-64 truncate font-bold sm:max-w-24 md:max-w-42 lg:max-w-72 xl:max-w-96 2xl:max-w-108">
                          {item.title}
                        </ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        {item.stat} {unit}
                      </ItemActions>
                    </Link>
                  </Item>
                )
              })
            )}
          </div>

          <DialogFooter className="items-center justify-between sm:justify-between">
            <div className="text-muted-foreground text-sm">
              第 {page} / {totalPages} 页
            </div>
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
                onClick={() =>
                  setPage((prev) => Math.min(totalPages, prev + 1))
                }
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
