'use client'

import { Search } from 'lucide-react'
import { motion } from 'motion/react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import AddEnding from '@/features/guide/components/add-ending'
import AddRoute from '@/features/guide/components/add-route'
import AddStep from '@/features/guide/components/add-step'
import ImportGuide from '@/features/guide/components/import-guide'
import { containerVariants, itemVariants } from '@/features/guide/data/motion'

type GuideToolAreaProps = {
  onSearch?: (keyword: string) => void
}

export default function GuideToolArea({ onSearch }: GuideToolAreaProps) {
  const [keyword, setKeyword] = useState('')

  const handleSearch = () => {
    onSearch?.(keyword)
  }

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
          placeholder="搜索攻略内容..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSearch()
            }
          }}
        />
        <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
      </motion.div>

      {/* 操作按钮 */}
      <motion.div
        className="grid grid-cols-2 gap-2 lg:flex lg:items-center"
        variants={itemVariants}
      >
        <AddRoute />
        <AddEnding />
        <AddStep />
        <ImportGuide />
      </motion.div>
    </motion.div>
  )
}
