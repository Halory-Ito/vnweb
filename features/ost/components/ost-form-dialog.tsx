'use client'

import { Loader2Icon } from 'lucide-react'

import { useOstForm } from '../hooks/use-ost-form'
import { OstAlbumPreview } from './ost-album-preview'
import { OstSearchResultsDialog } from './ost-search-results-dialog'
import { OstSourceSearch } from './ost-source-search'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { OstFormDialogProps } from '../hooks/use-ost-form'

export function OstFormDialog(props: OstFormDialogProps) {
  const { open, editingItem, isSubmitting, onOpenChange } = props
  const state = useOstForm(props)
  const { form, setForm, gameCards, albumDetails } = state
  return (
    <>
      <OstSearchResultsDialog
        results={state.searchResults}
        open={state.showResults}
        onOpenChange={state.setShowResults}
        onSelect={(album) => state.select.mutate(album)}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑 OST' : '添加 OST'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改 OST 信息' : '搜索并添加 OST 专辑'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-1">
            <div className="space-y-2">
              <Label htmlFor="ost-game">关联游戏</Label>
              <Select
                value={form.gameId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, gameId: value }))}
              >
                <SelectTrigger id="ost-game" className="w-full">
                  <SelectValue placeholder="选择游戏" />
                </SelectTrigger>
                <SelectContent>
                  {gameCards.map((game) => (
                    <SelectItem key={game.id} value={String(game.id)}>
                      {game.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!editingItem && (
              <>
                <OstSourceSearch state={state} />
                {state.isBusy && (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2Icon className="size-4 animate-spin" />
                    正在读取专辑...
                  </p>
                )}
                {albumDetails && (
                  <OstAlbumPreview albumDetails={albumDetails} onReset={state.resetResults} />
                )}
              </>
            )}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="ost-name">OST 名称</Label>
                <Input
                  id="ost-name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="输入 OST 名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ost-cover">封面图片</Label>
                <Input
                  id="ost-cover"
                  value={form.cover}
                  onChange={(event) => setForm((prev) => ({ ...prev, cover: event.target.value }))}
                  placeholder="输入封面图片 URL"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button
              onClick={state.submit}
              disabled={!state.isValid || state.isBusy || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  保存中...
                </>
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
