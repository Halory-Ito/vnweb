'use client'

import { Search } from 'lucide-react'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import AddEnding from '@/features/guide/components/add-ending'
import AddRoute from '@/features/guide/components/add-route'
import AddStep from '@/features/guide/components/add-step'
import ImportGuide from '@/features/guide/components/import-guide'

type GuideToolAreaProps = {
  onSearch?: (keyword: string) => void
}

export default function GuideToolArea({ onSearch }: GuideToolAreaProps) {
  const [keyword, setKeyword] = useState('')

  const handleSearch = () => {
    onSearch?.(keyword)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* 搜索框 */}
      <div className="relative flex-1 sm:max-w-md">
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
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center gap-2">
        <AddRoute />
        <AddEnding />
        <AddStep />
        <ImportGuide />
      </div>
    </div>
  )
}
