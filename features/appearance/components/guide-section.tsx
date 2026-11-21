'use client'

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
              <input
                type="color"
                value={draft[item.key]}
                onChange={(e) => updateDraft(item.key, e.target.value)}
                onBlur={() => confirmColor(item.key)}
                className="border-input h-8 w-8 cursor-pointer rounded border"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
