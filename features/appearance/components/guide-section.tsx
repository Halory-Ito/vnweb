'use client'

import AppearanceColorInput from './appearance-color-input'
import { useGuideSettings } from '@/features/appearance/hooks/use-guide-settings'

import type { GuideColorSettings } from '@/lib/settings/guide-settings'

const colorItems: { key: keyof GuideColorSettings; label: string }[] = [
  { key: 'choice', label: '选项' },
  { key: 'save', label: '保存' },
  { key: 'load', label: '读取' },
  { key: 'note', label: '备注' },
]

export function GuideSection() {
  const { draft, updateDraft, confirmColor } = useGuideSettings()

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <p className="text-base font-semibold">攻略</p>

      <div className="space-y-4">
        {colorItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">{draft[item.key]}</span>
              <AppearanceColorInput
                aria-label={`${item.label}颜色`}
                value={draft[item.key]}
                onChange={(e) => updateDraft(item.key, e.target.value)}
                onBlur={() => confirmColor(item.key)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
