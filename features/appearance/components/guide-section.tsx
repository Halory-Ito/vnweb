'use client'

import { useGuideSettings } from '@/features/appearance/hooks/use-guide-settings'
import type { GuideColorSettings } from '@/lib/settings/guide-settings'

const colorItems: { key: keyof GuideColorSettings; label: string; description: string }[] = [
  { key: 'choice', label: '选项', description: '攻略中的选项步骤颜色' },
  { key: 'save', label: '保存', description: '攻略中的保存步骤颜色' },
  { key: 'load', label: '读取', description: '攻略中的读取步骤颜色' },
  { key: 'note', label: '备注', description: '攻略中的备注步骤颜色' },
]

export function GuideSection() {
  const { draft, updateDraft, confirmColor } = useGuideSettings()

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <div>
        <p className="text-base font-semibold">攻略</p>
        <p className="text-muted-foreground mt-1 text-sm">
          自定义攻略步骤的颜色，设置将应用到所有攻略页面。
        </p>
      </div>

      <div className="space-y-4">
        {colorItems.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-medium">{item.label}</span>
              <p className="text-muted-foreground text-xs">{item.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">
                {draft[item.key]}
              </span>
              <input
                type="color"
                value={draft[item.key]}
                onChange={(e) => updateDraft(item.key, e.target.value)}
                onBlur={() => confirmColor(item.key)}
                className="h-8 w-8 cursor-pointer rounded border border-input"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
