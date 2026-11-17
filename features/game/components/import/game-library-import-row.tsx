import { Checkbox } from '@/components/ui/checkbox'

import type { GameLibraryImportRow as ImportRow } from '../../lib/game-library-import'

const STATUS_LABELS = {
  idle: '待导入',
  importing: '导入中...',
  imported: '已导入',
  skipped: '已存在',
  failed: '失败',
}

type GameLibraryImportRowProps = {
  item: ImportRow
  disabled: boolean
  onToggle: (id: string, selected: boolean) => void
}

export function GameLibraryImportRow({ item, disabled, onToggle }: GameLibraryImportRowProps) {
  const status =
    item.status === 'failed' ? `失败：${item.reason || '未知错误'}` : STATUS_LABELS[item.status]

  return (
    <div className="grid grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-x-2 gap-y-1 rounded-md border p-2 text-sm sm:grid-cols-[auto_auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
      <Checkbox
        aria-label={`选择 ${item.name}`}
        checked={item.selected}
        disabled={disabled || item.status === 'imported' || item.status === 'skipped'}
        onCheckedChange={(checked) => onToggle(item.id, Boolean(checked))}
      />
      <div className="size-8 overflow-hidden rounded border">
        <img
          src={item.coverUrl || '/file.svg'}
          alt={item.name}
          className="size-full object-cover"
          loading="lazy"
          onError={(event) => {
            const target = event.currentTarget
            target.onerror = null
            if (!target.src.endsWith('/file.svg')) target.src = '/file.svg'
          }}
        />
      </div>
      <div className="min-w-0">
        <div className="truncate" title={item.name}>
          {item.name}
        </div>
        {item.note ? (
          <div className="text-muted-foreground truncate text-xs" title={item.note}>
            {item.note}
          </div>
        ) : null}
      </div>
      <div className="col-start-3 flex min-w-0 flex-wrap gap-x-3 text-xs sm:contents sm:text-sm">
        <div className="truncate" title={item.detail}>
          {item.detail}
        </div>
        <div className="truncate" title={status}>
          {status}
        </div>
      </div>
    </div>
  )
}
