import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useGameStatusEntrySearch } from '@/features/game/hooks/use-game-status-entry-search'
import { GAME_STATUS_SYNC_LABELS } from '@/lib/settings/game-status-sync'

import type { GameStatusSyncProvider } from '@/types'

export function GameStatusEntryDialog({
  gameId,
  gameName,
  provider,
  onClose,
}: {
  gameId: number
  gameName: string
  provider: GameStatusSyncProvider
  onClose: () => void
}) {
  const {
    keyword,
    setKeyword,
    results,
    binding,
    hasSearched,
    search,
    hasPrevious,
    hasNext,
    changePage,
  } = useGameStatusEntrySearch(gameId, provider, gameName, onClose)
  const [entryId, setEntryId] = useState('')
  const busy = results.isFetching || binding.isPending

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !binding.isPending) onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[85dvh] overflow-y-auto sm:max-w-lg"
      >
        <DialogHeader>
          <DialogTitle>关联 {GAME_STATUS_SYNC_LABELS[provider]} 条目</DialogTitle>
        </DialogHeader>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (keyword.trim() && !busy) search()
          }}
        >
          <Input
            aria-label="游戏名称"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Button type="submit" variant="outline" disabled={busy || !keyword.trim()}>
            搜索
          </Button>
        </form>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (!binding.isPending && entryId.trim()) binding.mutate(entryId.trim())
          }}
        >
          <Input
            aria-label="平台条目 ID"
            placeholder={provider === 'bangumi' ? '输入 Bangumi ID' : '输入 VNDB ID'}
            value={entryId}
            onChange={(event) => setEntryId(event.target.value)}
            disabled={binding.isPending}
          />
          <Button type="submit" variant="outline" disabled={binding.isPending || !entryId.trim()}>
            按 ID 关联
          </Button>
        </form>
        <div aria-live="polite" className="space-y-2">
          {results.isFetching && <p className="text-muted-foreground text-sm">搜索中…</p>}
          {results.isError && <p className="text-muted-foreground text-sm">搜索失败</p>}
          {hasSearched &&
            results.isSuccess &&
            !results.isFetching &&
            !results.data.items.length && (
              <p className="text-muted-foreground text-sm">未找到条目</p>
            )}
          {results.data?.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium wrap-break-word">{item.name || item.id}</p>
                <p className="text-muted-foreground text-xs">
                  {[item.id, item.date, item.developer].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => binding.mutate(item.id)}
              >
                {binding.isPending && binding.variables === item.id ? '关联中…' : '关联'}
              </Button>
            </div>
          ))}
        </div>
        {(hasPrevious || hasNext) && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !hasPrevious}
              onClick={() => changePage(-1)}
            >
              上一页
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy || !hasNext}
              onClick={() => changePage(1)}
            >
              下一页
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
