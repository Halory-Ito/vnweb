'use client'

import { FileQuestion, Loader2, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { GuideSearchResult } from '@/features/guide/guide-api'

type ImportSearchTabProps = {
  keyword: string
  setKeyword: (value: string) => void
  searchResults: GuideSearchResult[]
  isSearching: boolean
  hasSearched: boolean
  selectedGuide: GuideSearchResult | null
  setSelectedGuide: (guide: GuideSearchResult | null) => void
  onSearch: () => void
}

export default function ImportSearchTab({
  keyword,
  setKeyword,
  searchResults,
  isSearching,
  hasSearched,
  selectedGuide,
  setSelectedGuide,
  onSearch,
}: ImportSearchTabProps) {
  return (
    <div className="space-y-4">
      {/* 搜索区域 */}
      <div className="space-y-2">
        <div className="text-sm font-medium">搜索攻略</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Input
              className="pr-4 pl-10"
              placeholder="输入游戏名称搜索攻略..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  onSearch()
                }
              }}
            />
            <Search className="text-muted-foreground absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={onSearch}
            disabled={isSearching || !keyword.trim()}
            className="shrink-0"
          >
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : '搜索'}
          </Button>
        </div>
      </div>

      {/* 搜索结果 */}
      <div className="space-y-2">
        <div className="text-sm font-medium">搜索结果</div>
        <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-2 sm:max-h-80">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <p className="text-muted-foreground mt-2 text-sm">搜索中...</p>
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((guide) => (
              <button
                key={guide.uid}
                type="button"
                className={`w-full overflow-hidden rounded-md p-2 text-left transition-colors ${
                  selectedGuide?.uid === guide.uid
                    ? 'border-primary/30 bg-primary/10 border'
                    : 'hover:bg-muted/50 border border-transparent'
                }`}
                onClick={() => setSelectedGuide(guide)}
              >
                <div className="flex items-center gap-3">
                  {guide.cover && (
                    <img
                      src={guide.cover}
                      alt={guide.name['zh-cn']}
                      className="h-10 w-8 shrink-0 rounded object-cover sm:h-16 sm:w-12"
                    />
                  )}
                  <div className="min-w-0 flex-1 truncate font-medium">{guide.name['zh-cn']}</div>
                </div>
              </button>
            ))
          ) : hasSearched ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileQuestion className="text-muted-foreground h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">未找到相关攻略</p>
              <p className="text-muted-foreground text-xs">请尝试其他关键词搜索</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search className="text-muted-foreground h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">输入游戏名称搜索攻略</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
