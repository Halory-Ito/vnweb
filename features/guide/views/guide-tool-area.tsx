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
    <div className="@container w-full">
      <motion.div
        className="flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* 搜索框 */}
        <motion.div
          className="relative w-full min-w-0 @3xl:max-w-md @3xl:flex-1"
          variants={itemVariants}
        >
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
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
        </motion.div>

        {/* 操作按钮 */}
        <motion.div
          className="grid grid-cols-2 gap-2 @md:grid-cols-4 @3xl:flex @3xl:shrink-0 @3xl:items-center"
          variants={itemVariants}
        >
          <AddRoute />
          <AddEnding />
          <AddStep />
          <ImportGuide />
        </motion.div>
      </motion.div>
    </div>
  )
}
