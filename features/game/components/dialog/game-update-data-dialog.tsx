'use client'

import { useGameUpdateData } from '../../hooks/use-game-update-data'
import { GameUpdateDataFields } from './game-update-data-fields'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
type GameUpdateDataDialogProps = {
  gameId: number
  initialKeyword?: string
  triggerDisabled: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GameUpdateDataDialog({
  gameId,
  initialKeyword,
  triggerDisabled,
  open,
  onOpenChange,
}: GameUpdateDataDialogProps) {
  const {
    enabledProviders,
    activeProvider,
    setProvider,
    keyword,
    setKeyword,
    results,
    searchPage,
    selectedId,
    isSearching,
    isFetchingInfo,
    isUpdating,
    fetchedInfo,
    selectedFields,
    selectedCount,
    totalPages,
    loadSearchResults,
    handleSearch,
    handleFetchInfoById,
    toggleField,
    selectAllFields,
    invertFields,
    handleApply,
  } = useGameUpdateData({ gameId, initialKeyword, open, onOpenChange })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" disabled={triggerDisabled}>
          批量更新
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>更新资料数据</DialogTitle>
          <DialogDescription>选择数据源并搜索，勾选需要覆盖的属性后更新</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
            <Select
              value={activeProvider || undefined}
              disabled={enabledProviders.length === 0}
              onValueChange={setProvider}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={enabledProviders.length > 0 ? '选择数据源' : '未开启数据源'}
                />
              </SelectTrigger>
              <SelectContent>
                {enabledProviders.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入名称搜索"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSearch()}
              disabled={isSearching || !activeProvider}
            >
              {isSearching ? '搜索中...' : '搜索'}
            </Button>
          </div>

          <div className="space-y-2 rounded-md border p-2">
            {results.length === 0 ? (
              <div className="text-muted-foreground p-2 text-sm">暂无搜索结果</div>
            ) : (
              results.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm">{item.name || '-'}</div>
                    <div className="text-muted-foreground truncate text-xs">
                      ID: {item.id} / {item.date || '-'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleFetchInfoById(item.id)}
                    disabled={isFetchingInfo}
                  >
                    使用
                  </Button>
                </div>
              ))
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isSearching || searchPage <= 1}
                onClick={() => void loadSearchResults(searchPage - 1)}
              >
                上一页
              </Button>
              <div className="text-muted-foreground self-center text-sm">
                第 {searchPage} / {totalPages} 页
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isSearching || searchPage >= totalPages}
                onClick={() => void loadSearchResults(searchPage + 1)}
              >
                下一页
              </Button>
            </DialogFooter>
          </div>

          <GameUpdateDataFields
            disabled={!fetchedInfo || isFetchingInfo || isUpdating}
            selectedFields={selectedFields}
            selectedCount={selectedCount}
            toggleField={toggleField}
            selectAllFields={selectAllFields}
            invertFields={invertFields}
          />

          {selectedId ? (
            <div className="text-muted-foreground text-xs">当前资料来源 ID: {selectedId}</div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            type="button"
            onClick={() => void handleApply()}
            disabled={isUpdating || isFetchingInfo || !fetchedInfo || selectedCount === 0}
          >
            {isUpdating ? '更新中...' : '确认更新'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
