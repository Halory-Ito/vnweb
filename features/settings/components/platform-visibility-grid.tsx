import { PLATFORM_LABELS } from '../hooks/use-platform-accounts'
import { Switch } from '@/components/ui/switch'

import type { PlatformVisibilityKey } from '@/lib/settings/platform-visibility'

const labels = { ...PLATFORM_LABELS, meting: 'Meting SDK', enhanced: '网易云 Enhanced API' }

const groups = [
  { label: '游戏库', keys: ['steam'] },
  { label: '游戏资料', keys: ['bangumi', 'vndb', 'ymgal'] },
  { label: '音乐服务', keys: ['meting', 'enhanced'] },
] satisfies { label: string; keys: PlatformVisibilityKey[] }[]

export function PlatformVisibilityGrid({
  isVisible,
  onChange,
  disabled,
}: {
  isVisible: (key: PlatformVisibilityKey) => boolean
  onChange: (key: PlatformVisibilityKey, visible: boolean) => void
  disabled: boolean
}) {
  return (
    <section
      aria-labelledby="platform-visibility-title"
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <h2 id="platform-visibility-title" className="text-base font-semibold">
        显示平台配置
      </h2>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(({ label, keys }) => (
          <fieldset key={label} className="min-w-0 space-y-3">
            <legend className="text-muted-foreground text-sm font-medium">{label}</legend>
            {keys.map((key) => {
              const visible = isVisible(key)
              return (
                <label
                  key={key}
                  id={visible ? undefined : `platform-section-${key}`}
                  className="relative flex min-w-0 scroll-mt-4 items-center justify-between gap-3 text-sm"
                >
                  {!visible && (key === 'bangumi' || key === 'vndb') && (
                    <span id={`status-mappings-${key}`} className="absolute top-0 scroll-mt-4" />
                  )}
                  {labels[key]}
                  <Switch
                    checked={visible}
                    disabled={disabled}
                    onCheckedChange={(next) => onChange(key, next)}
                  />
                </label>
              )
            })}
          </fieldset>
        ))}
      </div>
    </section>
  )
}
