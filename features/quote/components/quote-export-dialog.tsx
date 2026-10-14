'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { QuoteExportMethod } from '@/features/quote/hooks/use-quote-export-dialog'
import type { GameOption } from '@/features/quote/types'

type QuoteExportDialogProps = {
  open: boolean
  gameOptions: GameOption[]
  selectedGameIds: string[]
  method: QuoteExportMethod
  isExporting: boolean
  allSelected: boolean
  someSelected: boolean
  onOpenChange: (open: boolean) => void
  onToggleGame: (id: string) => void
  onToggleAll: () => void
  onMethodChange: (method: QuoteExportMethod) => void
  onSubmit: () => void
}

export function QuoteExportDialog({
  open,
  gameOptions,
  selectedGameIds,
  method,
  isExporting,
  allSelected,
  someSelected,
  onOpenChange,
  onToggleGame,
  onToggleAll,
  onMethodChange,
  onSubmit,
}: QuoteExportDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导出摘录</DialogTitle>
          <DialogDescription className="sr-only">选择游戏与导出方式后导出摘录</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* 选择游戏 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">选择游戏</div>

            <div className="rounded-lg border">
              <div className="flex items-center gap-3 border-b px-3 py-2.5">
                <Checkbox
                  id="quote-export-game-all"
                  checked={someSelected ? 'indeterminate' : allSelected}
                  onCheckedChange={onToggleAll}
                />
                <label
                  htmlFor="quote-export-game-all"
                  className="flex-1 cursor-pointer text-sm font-medium"
                >
                  全部游戏
                </label>
              </div>

              {gameOptions.length === 0 ? (
                <p className="text-muted-foreground px-3 py-6 text-center text-sm">
                  暂无可导出的游戏
                </p>
              ) : (
                <ScrollArea className="h-56">
                  <div className="space-y-0.5 p-1.5">
                    {gameOptions.map((game) => {
                      const checkboxId = `quote-export-game-${game.id}`
                      return (
                        <div
                          key={game.id}
                          className="hover:bg-muted flex items-center gap-3 rounded-md px-2 py-1.5"
                        >
                          <Checkbox
                            id={checkboxId}
                            checked={selectedGameIds.includes(game.id)}
                            onCheckedChange={() => onToggleGame(game.id)}
                          />
                          <label
                            htmlFor={checkboxId}
                            className="flex-1 cursor-pointer truncate text-sm"
                            title={game.label}
                          >
                            {game.label}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>

          {/* 导出方式 */}
          <div className="space-y-2">
            <div className="text-sm font-medium">导出方式</div>
            <Select
              value={method}
              onValueChange={(value) => onMethodChange(value as QuoteExportMethod)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择导出方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xlsx">XLSX 表格文件（.xlsx）</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            取消
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isExporting || selectedGameIds.length === 0}
          >
            {isExporting ? '导出中...' : '导出'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
