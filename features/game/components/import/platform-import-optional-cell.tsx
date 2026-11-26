'use client'

import { formatPlatformImportHours } from '../../data/platform-import-sources'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TableCell } from '@/components/ui/table'

import type {
  PlatformImportConflictStrategy,
  PlatformImportOptionalColumn,
  PlatformImportPreviewItem,
} from '@/types/platform-import'

const STRATEGY_LABELS: Record<PlatformImportConflictStrategy, (platformLabel: string) => string> = {
  keep_existing: () => '仅保留当前库',
  merge: () => '合并双端数据',
  replace_with_imported: (label) => `仅保留 ${label}`,
}

type PlatformImportOptionalCellProps = {
  columnId: PlatformImportOptionalColumn
  item: PlatformImportPreviewItem
  platformLabel: string
  disabled: boolean
  strategy: PlatformImportConflictStrategy
  hasResult: boolean
  onStrategyChange: (sourceId: string, strategy: PlatformImportConflictStrategy) => void
}

export function PlatformImportOptionalCell({
  columnId,
  item,
  platformLabel,
  disabled,
  strategy,
  hasResult,
  onStrategyChange,
}: PlatformImportOptionalCellProps) {
  const title = item.nameCn || item.name

  if (columnId === 'developer') {
    return (
      <TableCell className="max-w-44 truncate" title={item.developer || undefined}>
        {item.developer || '-'}
      </TableCell>
    )
  }

  if (columnId === 'playStatus') {
    return (
      <TableCell>
        <Badge variant="outline">{item.playStatusLabel}</Badge>
      </TableCell>
    )
  }

  if (columnId === 'records') {
    return (
      <TableCell className="text-right tabular-nums">
        {item.recordCount > 0 ? `${item.recordCount} 条` : '-'}
      </TableCell>
    )
  }

  if (columnId === 'collections') {
    const text = item.collectionNames.join('、')
    return (
      <TableCell className="max-w-44 truncate" title={text || undefined}>
        {text || '-'}
      </TableCell>
    )
  }

  if (columnId === 'memories') {
    return (
      <TableCell className="text-right tabular-nums">
        {item.memoryCount > 0 ? `${item.memoryCount} 条` : '-'}
      </TableCell>
    )
  }

  if (columnId === 'characters') {
    return (
      <TableCell className="text-right tabular-nums">
        {item.characterCount > 0 ? `${item.characterCount} 位` : '-'}
      </TableCell>
    )
  }

  if (columnId === 'matchInfo') {
    if (!item.alreadyExists) {
      return (
        <TableCell>
          <Badge variant="outline">未导入</Badge>
        </TableCell>
      )
    }
    const matchLabel = item.matchType === 'external_id' ? '数据源 ID' : '游戏名称'
    const existingSummary =
      item.matchedGamePlayTime !== undefined
        ? `当前库 ${formatPlatformImportHours(item.matchedGamePlayTime)}${item.matchedGameRecordCount ? ` · ${item.matchedGameRecordCount} 记录` : ''}`
        : ''
    return (
      <TableCell>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" title={item.matchDetail}>
            {matchLabel}
          </Badge>
          {existingSummary ? (
            <span className="text-muted-foreground text-xs" title={item.matchedGameName}>
              {existingSummary}
            </span>
          ) : null}
        </div>
      </TableCell>
    )
  }

  if (!item.alreadyExists) {
    return (
      <TableCell>
        <Badge variant="outline">新增导入</Badge>
      </TableCell>
    )
  }

  if (hasResult) {
    return (
      <TableCell>
        <Badge variant="outline">{STRATEGY_LABELS[strategy](platformLabel)}</Badge>
      </TableCell>
    )
  }

  return (
    <TableCell>
      <Select
        value={strategy}
        disabled={disabled}
        onValueChange={(value) =>
          onStrategyChange(item.sourceId, value as PlatformImportConflictStrategy)
        }
      >
        <SelectTrigger aria-label={`${title} 冲突处理`} className="h-7 w-36 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="keep_existing">仅保留当前库</SelectItem>
          <SelectItem value="merge">合并双端数据</SelectItem>
          <SelectItem value="replace_with_imported">仅保留 {platformLabel}</SelectItem>
        </SelectContent>
      </Select>
    </TableCell>
  )
}
