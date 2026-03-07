'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { getGamePvsById, type GameMediaLinkItem } from '@/lib/game-utils'

type GamePVProps = {
  gameId: number
}

export default function GamePV({ gameId }: GamePVProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [items, setItems] = useState<GameMediaLinkItem[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  )

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await getGamePvsById(gameId)
      setItems(data.items)
      if (data.items.length > 0) {
        setSelectedId((prev) => prev ?? data.items[0].id)
      } else {
        setSelectedId(null)
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '加载PV失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [gameId])

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
      <div className="space-y-3 rounded-md border p-3">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => void loadData()}
          >
            刷新
          </Button>
        </div>

        <div className="max-h-105 space-y-2 overflow-y-auto">
          {isLoading ? (
            <div className="text-muted-foreground text-sm">加载中...</div>
          ) : items.length === 0 ? (
            <div className="text-muted-foreground text-sm">暂无PV</div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === item.id
                    ? 'bg-muted border-primary'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="truncate font-medium">{item.name}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-md border p-3">
        {selectedItem ? (
          <video
            key={selectedItem.id}
            controls
            preload="metadata"
            className="h-auto w-full rounded-md border bg-black"
            src={selectedItem.url}
          />
        ) : (
          <div className="text-muted-foreground flex min-h-60 items-center justify-center rounded-md border text-sm">
            请选择一个 PV 进行播放
          </div>
        )}
      </div>
    </div>
  )
}
