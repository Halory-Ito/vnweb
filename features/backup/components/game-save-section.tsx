'use client'

import { FolderOpenIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useBackupSettingsContext } from '@/features/backup/context/backup-settings-context'

export function GameSaveSection() {
  const {
    gameSaveEnabled,
    setGameSaveEnabled,
    gameSaveDir,
    setGameSaveDir,
    isSavingGameSave,
    handleSelectGameSaveDir,
    handleSaveGameSaveConfig,
  } = useBackupSettingsContext()

  return (
    <section className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-6">
      <h2 className="text-base font-semibold">游戏存档</h2>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label htmlFor="game-save-enabled">启用游戏存档备份</Label>
        <Switch
          id="game-save-enabled"
          checked={gameSaveEnabled}
          onCheckedChange={setGameSaveEnabled}
        />
      </div>
      <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
        <Label htmlFor="game-save-dir">存档目录</Label>
        <div className="flex w-full max-w-md items-center gap-2">
          <Input
            id="game-save-dir"
            value={gameSaveDir}
            onChange={(e) => setGameSaveDir(e.target.value)}
            disabled={!gameSaveEnabled}
          />
          <Button
            variant="outline"
            size="icon"
            disabled={!gameSaveEnabled}
            onClick={() => void handleSelectGameSaveDir()}
          >
            <FolderOpenIcon className="size-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-end">
        <Button disabled={isSavingGameSave} onClick={() => void handleSaveGameSaveConfig()}>
          {isSavingGameSave ? '保存中...' : '保存'}
        </Button>
      </div>
    </section>
  )
}
