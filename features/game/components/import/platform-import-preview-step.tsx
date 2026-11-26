'use client'

import { useId } from 'react'

import { PlatformImportColumnPicker } from './platform-import-column-picker'
import { PlatformImportOptions } from './platform-import-options'
import { PlatformImportRow } from './platform-import-row'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import type { usePlatformImport } from '../../hooks/use-platform-import'
import type { PlatformImportOptionalColumn } from '@/types/platform-import'

const RIGHT_ALIGNED_COLUMNS = new Set<PlatformImportOptionalColumn>([
  'records',
  'memories',
  'characters',
])

export function PlatformImportPreviewStep({
  state,
}: {
  state: ReturnType<typeof usePlatformImport>
}) {
  const onlyNewId = useId()
  const preview = state.preview
  if (!preview) return null

  const hasExecuteResult = Boolean(state.executeResult)
  const emptyColSpan = 4 + state.activeOptionalColumns.length + (hasExecuteResult ? 1 : 0)

  return (
    <div className="space-y-3">
      {state.executeResult ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-2.5 text-sm">
          <Badge variant="outline">新增 {state.executeResult.importedCount}</Badge>
          <Badge variant="outline">合并 {state.executeResult.mergedCount}</Badge>
          {state.executeResult.replacedCount > 0 ? (
            <Badge variant="outline">覆盖 {state.executeResult.replacedCount}</Badge>
          ) : null}
          <Badge variant="outline">跳过 {state.executeResult.skippedCount}</Badge>
          {state.executeResult.failedCount > 0 ? (
            <Badge variant="outline">失败 {state.executeResult.failedCount}</Badge>
          ) : null}
          {state.executeResult.collectionsCreated > 0 ? (
            <Badge variant="outline">新建收藏夹 {state.executeResult.collectionsCreated}</Badge>
          ) : null}
        </div>
      ) : null}

      {preview.warnings.length > 0 ? (
        <div className="max-h-24 space-y-1 overflow-y-auto rounded-md border p-2.5 text-xs">
          {preview.warnings.slice(0, 10).map((warning, idx) => (
            <div key={idx} className="truncate">
              {warning}
            </div>
          ))}
        </div>
      ) : null}

      <PlatformImportOptions
        options={state.options}
        sourceMeta={state.sourceMeta}
        disabled={state.isImporting || hasExecuteResult}
        onChange={state.handleOptionChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={state.keyword}
          onChange={(event) => state.setKeyword(event.target.value)}
          placeholder="搜索游戏名或开发商"
          disabled={state.isImporting}
          className="min-w-44 flex-1"
        />
        <PlatformImportColumnPicker
          columns={state.availableOptionalColumns}
          visibleColumns={state.visibleColumns}
          disabled={state.isImporting}
          onToggle={state.toggleColumn}
          onReset={state.resetVisibleColumns}
        />
        <div className="flex items-center gap-2">
          <Label htmlFor={onlyNewId}>仅显示未导入</Label>
          <Switch
            id={onlyNewId}
            checked={state.onlyNew}
            disabled={state.isImporting}
            onCheckedChange={state.setOnlyNew}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  aria-label="全选当前列表"
                  checked={state.headerSelectState.checked}
                  disabled={
                    state.isImporting ||
                    hasExecuteResult ||
                    state.headerSelectState.selectableCount === 0
                  }
                  onCheckedChange={(checked) => state.setAllVisibleSelected(Boolean(checked))}
                />
              </TableHead>
              <TableHead className="w-14">封面</TableHead>
              <TableHead className="min-w-48">游戏名称</TableHead>
              <TableHead className="w-24 text-right">游玩时长</TableHead>
              {state.activeOptionalColumns.map((col) => (
                <TableHead
                  key={col.id}
                  className={RIGHT_ALIGNED_COLUMNS.has(col.id) ? 'text-right' : undefined}
                >
                  {col.label}
                </TableHead>
              ))}
              {hasExecuteResult ? <TableHead>导入结果</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {state.visibleItems.length > 0 ? (
              state.visibleItems.map((item) => (
                <PlatformImportRow
                  key={item.sourceId}
                  item={item}
                  platformLabel={state.sourceMeta.label}
                  checked={state.selectedIds.has(item.sourceId)}
                  selectable={state.isItemSelectable(item)}
                  disabled={state.isImporting}
                  strategy={state.getEffectiveStrategy(item.sourceId)}
                  activeOptionalColumns={state.activeOptionalColumns}
                  showResultColumn={hasExecuteResult}
                  result={state.resultMap.get(item.sourceId)}
                  onToggle={state.toggleItem}
                  onStrategyChange={state.handleItemStrategyChange}
                />
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={emptyColSpan}
                  className="text-muted-foreground h-20 text-center"
                >
                  没有符合当前筛选条件的游戏
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
