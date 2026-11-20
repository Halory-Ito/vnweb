'use client'

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useLayoutVisibility } from '@/hooks/use-layout-visibility'

export function LayoutSection() {
  const { sidebarHidden, setSidebarHidden, headerHidden, setHeaderHidden } = useLayoutVisibility()

  return (
    <section
      aria-labelledby="layout-settings"
      className="dark:border-input dark:bg-input/20 flex flex-col gap-4 rounded-xl border p-6"
    >
      <h2 id="layout-settings" className="text-base font-semibold">
        布局
      </h2>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label htmlFor="hide-sidebar">隐藏侧边栏</Label>
        <Switch id="hide-sidebar" checked={sidebarHidden} onCheckedChange={setSidebarHidden} />
      </div>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label htmlFor="hide-header">隐藏顶栏</Label>
        <Switch id="hide-header" checked={headerHidden} onCheckedChange={setHeaderHidden} />
      </div>
    </section>
  )
}
