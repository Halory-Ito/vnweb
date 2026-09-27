'use client'

import { RefreshCwIcon, SearchIcon } from 'lucide-react'
import { useMemo } from 'react'

import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Spinner } from '@/components/ui/spinner'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import type { FontSourceFilter, LocalFontItem } from './font-types'

const SOURCE_FILTERS: Array<{ value: FontSourceFilter; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'system', label: '系统' },
  { value: 'user', label: '用户' },
]

type FontListPanelProps = {
  fonts: LocalFontItem[]
  isLoading: boolean
  isImportingPath: string | null
  sourceFilter: FontSourceFilter
  searchKeyword: string
  onSourceFilterChange: (value: FontSourceFilter) => void
  onSearchKeywordChange: (value: string) => void
  onRefresh: () => void
  onImport: (font: LocalFontItem) => void
}

export function FontListPanel({
  fonts,
  isLoading,
  isImportingPath,
  sourceFilter,
  searchKeyword,
  onSourceFilterChange,
  onSearchKeywordChange,
  onRefresh,
  onImport,
}: FontListPanelProps) {
  const filteredFonts = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()

    return fonts.filter((font) => {
      if (sourceFilter !== 'all' && font.source !== sourceFilter) return false
      if (!keyword) return true
      return font.name.toLowerCase().includes(keyword)
    })
  }, [fonts, searchKeyword, sourceFilter])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2">
        <InputGroup>
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            value={searchKeyword}
            placeholder="搜索字体名称"
            onChange={(event) => onSearchKeywordChange(event.target.value)}
          />
        </InputGroup>
        <Button
          type="button"
          variant="outline"
          size="icon"
          title="刷新字体列表"
          disabled={isLoading}
          onClick={onRefresh}
        >
          {isLoading ? <Spinner /> : <RefreshCwIcon />}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={sourceFilter}
          onValueChange={(value) => {
            if (value) onSourceFilterChange(value as FontSourceFilter)
          }}
        >
          {SOURCE_FILTERS.map((filter) => (
            <ToggleGroupItem key={filter.value} value={filter.value}>
              {filter.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="text-muted-foreground shrink-0 text-xs">{filteredFonts.length} 个</span>
      </div>

      <ScrollArea className="h-[322px]">
        <div className="pr-3">
          {filteredFonts.length === 0 ? (
            <p className="text-muted-foreground py-16 text-center text-sm">
              {isLoading ? '正在读取字体...' : '没有匹配的字体'}
            </p>
          ) : (
            filteredFonts.map((font) => (
              <div
                key={`${font.path}-${font.source}`}
                className="hover:bg-accent/50 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm">{font.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {font.source === 'system' ? '系统字体' : '用户字体'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  disabled={isImportingPath === font.path}
                  onClick={() => onImport(font)}
                >
                  {isImportingPath === font.path ? <Spinner className="size-3" /> : '预览'}
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
