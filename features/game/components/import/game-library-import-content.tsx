import { useGameLibraryImport } from '../../hooks/use-game-library-import'
import { GameLibraryImportAccount } from './game-library-import-account'
import { GameLibraryImportResults } from './game-library-import-results'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'

import type { GameLibraryImportProvider } from '../../data/game-library-import-providers'

type GameLibraryImportContentProps = {
  provider: GameLibraryImportProvider
  onBusyChange: (busy: boolean) => void
}

export function GameLibraryImportContent({
  provider,
  onBusyChange,
}: GameLibraryImportContentProps) {
  const state = useGameLibraryImport(provider, onBusyChange)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
        <GameLibraryImportAccount state={state} />
        <GameLibraryImportResults state={state} />
      </div>
      <DialogFooter className="shrink-0">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={state.isImporting}>
            取消
          </Button>
        </DialogClose>
        <Button
          type="button"
          disabled={state.isSearching || state.isImporting || state.selectedCount === 0}
          onClick={state.handleImport}
        >
          {state.isImporting ? '导入中...' : '导入已勾选游戏'}
        </Button>
      </DialogFooter>
    </div>
  )
}
