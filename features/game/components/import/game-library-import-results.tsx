import { useId } from 'react'

import { GameLibraryImportRow } from './game-library-import-row'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

import type { useGameLibraryImport } from '../../hooks/use-game-library-import'

export function GameLibraryImportResults({
  state,
}: {
  state: ReturnType<typeof useGameLibraryImport>
}) {
  const filterId = useId()
  const disabled = state.isSearching || state.isImporting || state.items.length === 0

  return (
    <div className="space-y-3">
      <div className="text-muted-foreground text-sm">
        共 {state.items.length} 项，已选 {state.selectedCount} 项，新增 {state.importedCount}{' '}
        项，已存在 {state.skippedCount} 项，失败 {state.failedCount} 项
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => state.setAllSelectable(true)}
        >
          全选可导入
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => state.setAllSelectable(false)}
        >
          取消全选
        </Button>
        <div className="flex w-full items-center gap-2 sm:ml-auto sm:w-auto">
          <Label htmlFor={filterId} className="text-muted-foreground">
            仅显示未导入
          </Label>
          <Switch
            id={filterId}
            checked={state.showOnlyNotImported}
            disabled={disabled}
            onCheckedChange={state.setShowOnlyNotImported}
          />
        </div>
      </div>
      <div className="space-y-2">
        {state.visibleItems.length === 0 ? (
          <div className="text-muted-foreground rounded-md border p-4 text-sm">
            {state.items.length > 0
              ? '当前筛选下没有可显示的游戏。'
              : state.provider === 'steam'
                ? '请先输入 UID 并搜索。'
                : '请先读取已绑定账号的游戏列表。'}
          </div>
        ) : (
          state.visibleItems.map((item) => (
            <GameLibraryImportRow
              key={item.id}
              item={item}
              disabled={state.isSearching || state.isImporting}
              onToggle={state.handleToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  )
}
