'use client'

import { ImageIcon } from 'lucide-react'
import { memo, useState } from 'react'

import { formatPlatformImportHours } from '../../data/platform-import-sources'
import { PlatformImportOptionalCell } from './platform-import-optional-cell'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'

import type { PlatformImportOptionalColumnMeta } from '../../data/platform-import-sources'
import type {
  PlatformImportConflictStrategy,
  PlatformImportExecuteItemResult,
  PlatformImportPreviewItem,
} from '@/types/platform-import'

const RESULT_LABELS: Record<PlatformImportExecuteItemResult['status'], string> = {
  imported: '已导入',
  merged: '已合并',
  replaced: '已覆盖',
  skipped: '已跳过',
  failed: '失败',
}

function CoverThumbnail({ coverUrl, title }: { coverUrl?: string; title: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="bg-muted/30 flex h-12 w-9 shrink-0 items-center justify-center overflow-hidden rounded border">
      {coverUrl && !failed ? (
        <img
          src={coverUrl}
          alt={title}
          loading="lazy"
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ImageIcon className="text-muted-foreground size-4" />
      )}
    </div>
  )
}

type PlatformImportRowProps = {
  item: PlatformImportPreviewItem
  platformLabel: string
  checked: boolean
  selectable: boolean
  disabled: boolean
  strategy: PlatformImportConflictStrategy
  activeOptionalColumns: PlatformImportOptionalColumnMeta[]
  showResultColumn: boolean
  result?: PlatformImportExecuteItemResult
  onToggle: (sourceId: string, checked: boolean) => void
  onStrategyChange: (sourceId: string, strategy: PlatformImportConflictStrategy) => void
}

export const PlatformImportRow = memo(function PlatformImportRow({
  item,
  platformLabel,
  checked,
  selectable,
  disabled,
  strategy,
  activeOptionalColumns,
  showResultColumn,
  result,
  onToggle,
  onStrategyChange,
}: PlatformImportRowProps) {
  const title = item.nameCn || item.name
  const subTitle = item.nameCn && item.name && item.nameCn !== item.name ? item.name : ''
  const isChecked = checked && selectable
  const resultText = result
    ? result.status === 'failed'
      ? `失败：${result.reason || '未知错误'}`
      : RESULT_LABELS[result.status]
    : '-'

  return (
    <TableRow data-state={isChecked ? 'selected' : undefined}>
      <TableCell className="w-10">
        <Checkbox
          aria-label={`选择 ${title}`}
          checked={isChecked}
          disabled={disabled || !selectable || Boolean(result)}
          onCheckedChange={(next) => onToggle(item.sourceId, Boolean(next))}
        />
      </TableCell>
      <TableCell className="w-14">
        <CoverThumbnail key={item.coverUrl || 'empty'} coverUrl={item.coverUrl} title={title} />
      </TableCell>
      <TableCell className="max-w-lg min-w-48 whitespace-normal">
        <div className="line-clamp-1 font-medium break-all" title={title}>
          {title}
        </div>
        {subTitle ? (
          <div className="text-muted-foreground line-clamp-1 text-xs break-all" title={subTitle}>
            {subTitle}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="w-24 text-right whitespace-nowrap tabular-nums">
        {formatPlatformImportHours(item.totalPlayTime)}
      </TableCell>
      {activeOptionalColumns.map((col) => (
        <PlatformImportOptionalCell
          key={col.id}
          columnId={col.id}
          item={item}
          platformLabel={platformLabel}
          disabled={disabled}
          strategy={strategy}
          hasResult={showResultColumn}
          onStrategyChange={onStrategyChange}
        />
      ))}
      {showResultColumn ? (
        <TableCell>
          <Badge variant="outline" title={result?.reason}>
            {resultText}
          </Badge>
        </TableCell>
      ) : null}
    </TableRow>
  )
})
