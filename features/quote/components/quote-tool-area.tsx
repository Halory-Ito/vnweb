'use client'

import { FileSpreadsheetIcon, Loader2Icon, PlusIcon, SearchIcon } from 'lucide-react'
import { motion } from 'motion/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

type QuoteToolAreaProps = {
  keywordInput: string
  isExporting: boolean
  onKeywordInputChange: (value: string) => void
  onSearch: () => void
  onCreate: () => void
  onExport: () => void
}

export function QuoteToolArea({
  keywordInput,
  isExporting,
  onKeywordInputChange,
  onSearch,
  onCreate,
  onExport,
}: QuoteToolAreaProps) {
  return (
    <motion.div
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="relative flex-1 sm:max-w-md" variants={itemVariants}>
        <Input
          className="pr-4 pl-10"
          placeholder="搜一搜游戏名 / 台词 / 角色..."
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch()
            }
          }}
        />
        <SearchIcon className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
      </motion.div>

      <motion.div className="flex flex-wrap items-center gap-2.5" variants={itemVariants}>
        <Button type="button" onClick={onCreate} variant="outline" className="rounded-full">
          <PlusIcon />
          新增摘录
        </Button>

        <Button
          type="button"
          onClick={onExport}
          variant="outline"
          className="rounded-full"
          disabled={isExporting}
        >
          {isExporting ? <Loader2Icon className="animate-spin" /> : <FileSpreadsheetIcon />}
          {isExporting ? '导出中...' : '导出 XLSX'}
        </Button>
      </motion.div>
    </motion.div>
  )
}
