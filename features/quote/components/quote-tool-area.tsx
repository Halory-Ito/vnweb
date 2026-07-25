'use client'

import dayjs from 'dayjs'
import { CalendarIcon, PlusIcon, RotateCcwIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

type QuoteToolAreaProps = {
  keywordInput: string
  dateFrom: string
  dateTo: string
  onKeywordInputChange: (value: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onReset: () => void
  onCreate: () => void
}

export function QuoteToolArea({
  keywordInput,
  dateFrom,
  dateTo,
  onKeywordInputChange,
  onDateFromChange,
  onDateToChange,
  onReset,
  onCreate,
}: QuoteToolAreaProps) {
  return (
    <motion.div
      className="space-y-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 搜索和筛选 */}
      <motion.div
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        variants={itemVariants}
      >
        {/* 搜索框 */}
        <div className="relative flex-1 sm:max-w-md">
          <Input
            placeholder="搜索游戏名称 / 台词内容 / 角色"
            value={keywordInput}
            onChange={(event) => onKeywordInputChange(event.target.value)}
          />
        </div>

        {/* 日期筛选 */}
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
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
                  <span className="hidden sm:inline">
                    {dateFrom ? dayjs(dateFrom).format('YYYY-MM-DD') : '开始日期'}
                  </span>
                  <span className="sm:hidden">
                    {dateFrom ? dayjs(dateFrom).format('MM-DD') : '开始'}
                  </span>
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
                  <span className="hidden sm:inline">
                    {dateTo ? dayjs(dateTo).format('YYYY-MM-DD') : '结束日期'}
                  </span>
                  <span className="sm:hidden">
                    {dateTo ? dayjs(dateTo).format('MM-DD') : '结束'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo ? new Date(dateTo) : undefined}
                  onSelect={(date) => onDateToChange(date ? dayjs(date).format('YYYY-MM-DD') : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground transition-colors"
            onClick={onReset}
          >
            <RotateCcwIcon className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">重置</span>
          </Button>
          <Button type="button" className="" variant="outline" onClick={onCreate}>
            <PlusIcon className="size-4 sm:mr-2" />
            <span className="hidden sm:inline">添加摘录</span>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
