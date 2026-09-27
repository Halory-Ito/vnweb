'use client'

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: string[]
}

const DEFAULT_PAGE_SIZE_OPTIONS = ['10', '20', '50', '100']

export function Pagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}: PaginationProps) {
  const startItem = total > 0 ? (page - 1) * pageSize + 1 : 0
  const endItem = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-4 sm:flex-row sm:justify-between">
      {/* 统计信息 */}
      <div className="text-muted-foreground text-sm">
        显示 {startItem}-{endItem} 条，共 {total} 条
      </div>

      {/* 分页控制 */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {/* 每页条数选择 */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">每页</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-sm">条</span>
        </div>

        {/* 页码导航 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-medium">{page}</span>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-muted-foreground text-sm">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages}
          >
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
