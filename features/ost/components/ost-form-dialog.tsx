'use client'

import { Loader2Icon } from 'lucide-react'

import { useOstForm } from '../hooks/use-ost-form'
import { OstAlbumFields } from './ost-album-fields'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { OstFormDialogProps } from '../hooks/use-ost-form'

export function OstFormDialog(props: OstFormDialogProps) {
  const { open, editingItem, isSubmitting, onOpenChange } = props
  const state = useOstForm(props)
  const { form, setForm, gameCards, albums } = state
  return (
    <>
      <Dialog open={open} onOpenChange={(next) => !isSubmitting && onOpenChange(next)}>
        <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? '编辑 OST' : '添加 OST'}</DialogTitle>
            <DialogDescription>
              {editingItem ? '修改 OST 信息' : '搜索并添加 OST 专辑'}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-2">
            <div className="space-y-2">
              <Label htmlFor="ost-game">关联游戏</Label>
              <Select
                disabled={isSubmitting}
                value={form.gameId}
                onValueChange={(value) => setForm((prev) => ({ ...prev, gameId: value }))}
              >
                <SelectTrigger id="ost-game" className="w-full">
                  <SelectValue placeholder="选择游戏" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {gameCards.map((game) => (
                      <SelectItem key={game.id} value={String(game.id)}>
                        {game.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {!editingItem && (
              <>
                <OstSourceSearch state={state} disabled={isSubmitting} />
                {state.isBusy && (
                  <p className="text-muted-foreground flex items-center gap-2 text-sm">
                    <Loader2Icon className="size-4 animate-spin" />
                    正在读取专辑...
                  </p>
                )}
                {albums.length > 0 && (
                  <div className="flex flex-col gap-4 border-t pt-4">
                    <p className="text-sm font-medium">待添加专辑（{albums.length}）</p>
                    {albums.map((album, index) => (
                      <OstAlbumFields
                        key={index}
                        id={`ost-album-${index}`}
                        name={album.name}
                        cover={album.cover}
                        disabled={isSubmitting}
                        onChange={(patch) => state.updateAlbum(index, patch)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
            {editingItem && (
              <OstAlbumFields
                id="ost-edit"
                name={form.name}
                cover={form.cover}
                disabled={isSubmitting}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={isSubmitting} onClick={() => onOpenChange(false)}>
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
              ) : albums.length > 1 ? (
                `保存 ${albums.length} 张专辑`
              ) : (
                '保存'
              )}
            </Button>
          </DialogFooter>
          {state.showResults && (
            <OstSearchResultsDialog
              results={state.searchResults}
              open={state.showResults}
              onOpenChange={state.setShowResults}
              onSelect={state.selectAlbums}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
