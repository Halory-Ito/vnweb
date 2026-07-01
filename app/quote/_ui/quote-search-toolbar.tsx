'use client'

import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'

type QuoteSearchToolbarProps = {
  keywordInput: string
  dateFrom: string
  dateTo: string
  onKeywordInputChange: (value: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onReset: () => void
}

export function QuoteSearchToolbar({
  keywordInput,
  dateFrom,
  dateTo,
  onKeywordInputChange,
  onDateFromChange,
  onDateToChange,
  onReset,
}: QuoteSearchToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-md">
        <Input
          placeholder="搜索游戏名称 / 台词内容 / 角色"
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
        />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 justify-start text-left font-normal',
                  !dateFrom && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : '开始日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom ? new Date(dateFrom) : undefined}
                onSelect={(date) =>
                  onDateFromChange(date ? dayjs(date).format('YYYY-MM-DD') : '')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <span className="text-muted-foreground">至</span>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'h-10 justify-start text-left font-normal',
                  !dateTo && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 size-4" />
                {dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : '结束日期'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo ? new Date(dateTo) : undefined}
                onSelect={(date) =>
                  onDateToChange(date ? dayjs(date).format('YYYY-MM-DD') : '')
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground h-10 transition-colors"
            onClick={onReset}
          >
            重置
          </Button>
        </div>
      </div>
    </div>
  )
}
