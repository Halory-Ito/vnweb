'use client'

import dayjs from 'dayjs'
import { EditIcon, Loader2Icon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import type { QuoteManageItem } from '@/lib/game/game-utils'

type QuoteManageContentProps = {
  items: QuoteManageItem[]
  isLoading: boolean
  isRefetching: boolean
  onEdit: (item: QuoteManageItem) => void
  onDelete: (item: QuoteManageItem) => void
}

export function QuoteManageContent({
  items,
  isLoading,
  isRefetching,
  onEdit,
  onDelete,
}: QuoteManageContentProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="text-muted-foreground size-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold">暂无摘录</h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          点击「添加摘录」记录游戏中的经典台词
        </p>
      </div>
    )
  }

  return (
    <div className="relative rounded-md border">
      {isRefetching && (
        <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
          <Loader2Icon className="text-muted-foreground size-6 animate-spin" />
        </div>
      )}
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">
              序号
            </TableHead>
            <TableHead className="w-40 text-center">
              游戏名称
            </TableHead>
            <TableHead className="w-64 text-center">
              台词内容
            </TableHead>
            <TableHead className="w-32 text-center">
              出自角色
            </TableHead>
            <TableHead className="w-48 text-center">
              台词背景
            </TableHead>
            <TableHead className="w-36 text-center">
              创建时间
            </TableHead>
            <TableHead className="w-24 text-center">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={item.id}>
              <TableCell className="text-center text-muted-foreground">
                {index + 1}
              </TableCell>
              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block truncate cursor-default">
                      {item.gameNameCn || item.gameName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.gameNameCn || item.gameName}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="line-clamp-2 cursor-default">
                      {item.content}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{item.content}</p>
                  </TooltipContent>
                </Tooltip>
              </TableCell>
              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="block truncate cursor-default">
                      {item.characterName || '-'}
                    </span>
                  </TooltipTrigger>
                  {item.characterName && (
                    <TooltipContent>
                      <p>{item.characterName}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TableCell>
              <TableCell className="text-center">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="line-clamp-2 cursor-default">
                      {item.context || '-'}
                    </div>
                  </TooltipTrigger>
                  {item.context && (
                    <TooltipContent>
                      <p className="max-w-xs">{item.context}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                <span className="block truncate">
                  {item.createdAt
                    ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')
                    : '-'}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => onEdit(item)}
                  >
                    <EditIcon className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive size-8"
                    onClick={() => onDelete(item)}
                  >
                    <Trash2Icon className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
