'use client'

import { useAtom, useAtomValue } from 'jotai'

import FolderPaletteEditor from './folder-palette-editor'
import GridDisplaySetting from './grid-display-setting'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import GameLibraryLayoutSelect from '@/features/game/components/game-library-layout-select'
import LibraryGroupSelect from '@/features/home/components/library-group-select'
import { borderlessAtom, useLayoutVisibility } from '@/hooks/use-layout-visibility'
import { gameLibraryGridDisplayAtom } from '@/lib/settings/game-library-grid-display'
import { gameLibraryLayoutAtom } from '@/lib/settings/game-library-layout'

export function LayoutSection() {
  const { sidebarHidden, setSidebarHidden, headerHidden, setHeaderHidden } = useLayoutVisibility()
  const [borderless, setBorderless] = useAtom(borderlessAtom)
  const layout = useAtomValue(gameLibraryLayoutAtom)
  const gridDisplay = useAtomValue(gameLibraryGridDisplayAtom)

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
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label htmlFor="borderless">无边框</Label>
        <Switch id="borderless" checked={borderless} onCheckedChange={setBorderless} />
      </div>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
        <Label htmlFor="game-library-layout">游戏库布局</Label>
        <GameLibraryLayoutSelect id="game-library-layout" />
      </div>
      {layout === 'grid' ? <GridDisplaySetting /> : null}
      {layout !== 'grid' || gridDisplay !== 'ungrouped' ? (
        <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
          <Label htmlFor="game-library-group">分类依据</Label>
          <LibraryGroupSelect id="game-library-group" />
        </div>
      ) : null}
      {layout === 'grid' && gridDisplay === 'folders' ? <FolderPaletteEditor /> : null}
    </section>
  )
}
