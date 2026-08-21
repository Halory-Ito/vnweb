'use client'

import { PlusIcon } from 'lucide-react'
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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

type QuoteToolAreaProps = {
  keywordInput: string
  onKeywordInputChange: (value: string) => void
  onSearch: () => void
  onCreate: () => void
}

export function QuoteToolArea({
  keywordInput,
  onKeywordInputChange,
  onSearch,
  onCreate,
}: QuoteToolAreaProps) {
  return (
    <motion.div
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 搜索框 */}
      <motion.div className="relative flex-1 sm:max-w-md" variants={itemVariants}>
        <Input
          className="pr-4 pl-10"
          placeholder="搜索游戏名称 / 台词内容 / 角色"
          value={keywordInput}
          onChange={(event) => onKeywordInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              onSearch()
            }
          }}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground absolute top-1/2 left-3.5 min-h-4 max-w-4 min-w-4 -translate-y-1/2"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </motion.div>

      {/* 新增按钮 */}
      <motion.div variants={itemVariants}>
        <Button type="button" onClick={onCreate} variant="outline">
          <PlusIcon />
          添加摘录
        </Button>
      </motion.div>
    </motion.div>
  )
}