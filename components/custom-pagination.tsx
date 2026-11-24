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

import type { ReactNode } from 'react'

type PaginationProps = {
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  pageSizeOptions?: string[]
  itemUnit?: string
  itemName?: string
  extraControls?: ReactNode
  sizeSelection?: { label: string; value: number; unit?: string }
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
  itemUnit = '条',
  itemName = '',
  extraControls,
  sizeSelection,
}: PaginationProps) {
  const startItem = total > 0 ? (page - 1) * pageSize + 1 : 0
  const endItem = Math.min(page * pageSize, total)
  const sizeLabel = sizeSelection?.label ?? '每页'
  const totalDigitMask = '8'.repeat(Math.max(1, String(total).length))
  const pageDigitMask = '8'.repeat(Math.max(1, String(totalPages).length))

  return (
    <div className="flex flex-col items-center gap-4 px-2 py-4 sm:flex-row sm:justify-between">
      {/* 统计信息 */}
      <div className="text-muted-foreground text-sm tabular-nums">
        {total === 0 && itemName ? (
          `共 0 ${itemUnit}${itemName}`
        ) : (
          <>
            显示{' '}
            <span className="inline-grid justify-items-center">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 select-none">
                {totalDigitMask}-{totalDigitMask}
              </span>
              <span className="col-start-1 row-start-1">
                {startItem}-{endItem}
              </span>
            </span>{' '}
            {itemUnit}，共 {total} {itemUnit}
            {itemName}
          </>
        )}
      </div>

      {/* 分页控制 */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        {extraControls}
        {/* 每页条数选择 */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">{sizeLabel}</span>
          <Select
            value={String(sizeSelection?.value ?? pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              className="h-8 w-20"
              aria-label={itemName ? `${sizeLabel}${itemName}数量` : `${sizeLabel}条数`}
            >
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
          <span className="text-muted-foreground text-sm">{sizeSelection?.unit ?? itemUnit}</span>
        </div>

        {/* 页码导航 */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="首页"
            onClick={() => onPageChange(1)}
            disabled={page === 1}
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="上一页"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <div className="flex items-center gap-1 px-2 tabular-nums">
            <span className="inline-grid justify-items-end text-sm font-medium">
              <span aria-hidden="true" className="invisible col-start-1 row-start-1 select-none">
                {pageDigitMask}
              </span>
              <span className="col-start-1 row-start-1">{page}</span>
            </span>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-muted-foreground text-sm">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="下一页"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="末页"
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
