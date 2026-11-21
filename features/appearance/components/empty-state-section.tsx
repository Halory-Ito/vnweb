'use client'

import { saveEmptyStateSettings } from '../hooks/use-empty-state-editor'
import EmptyStateListEditor from './empty-state-list-editor'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useEmptyStateSettings } from '@/hooks/use-empty-state-settings'

export function EmptyStateSection() {
  const settings = useEmptyStateSettings()

  return (
    <section
      aria-labelledby="empty-state-settings"
      className="dark:bg-input/20 flex flex-col gap-5 rounded-xl border p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="empty-state-settings" className="text-base font-semibold">
          空状态
        </h2>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          aria-label="空状态显示方式"
          value={settings.mode}
          onValueChange={(mode) => {
            if (mode === 'kaomoji' || mode === 'image') {
              saveEmptyStateSettings((current) => ({ ...current, mode }))
            }
          }}
        >
          <ToggleGroupItem value="kaomoji">颜文字</ToggleGroupItem>
          <ToggleGroupItem value="image">图片</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <EmptyStateListEditor itemKey="kaomoji" items={settings.kaomoji} />
        <EmptyStateListEditor itemKey="images" items={settings.images} />
      </div>
    </section>
  )
}
