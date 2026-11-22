'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'

import AppearanceColorInput from './appearance-color-input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { useStatusNameEditor } from '@/features/appearance/hooks/use-status-name-editor'
import { useStatusSettings } from '@/features/appearance/hooks/use-status-settings'
import {
  GAME_STATUS_NAME_MAX_LENGTH,
  getGamePlayStatusOptions,
} from '@/features/game/lib/game-status'

export function StatusSection() {
  const { draft, updateDraft, confirmColor } = useStatusSettings()
  const names = useStatusNameEditor()
  const options = getGamePlayStatusOptions(names.names)

  return (
    <div className="dark:border-input dark:bg-input/20 space-y-6 rounded-xl border p-6">
      <p className="text-base font-semibold">游戏状态</p>

      <form
        className="flex flex-wrap items-center justify-end gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (!names.disabled && names.newName.trim()) names.addName()
        }}
      >
        <InputGroup className="min-w-0 flex-1 basis-48">
          <InputGroupInput
            aria-label="新游戏状态名称"
            placeholder="输入游戏状态名称"
            value={names.newName}
            maxLength={GAME_STATUS_NAME_MAX_LENGTH}
            disabled={names.disabled}
            onChange={(event) => names.setNewName(event.target.value)}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              type="submit"
              size="icon-sm"
              aria-label={names.isAdding ? '正在添加状态' : '添加状态'}
              disabled={names.disabled || !names.newName.trim()}
            >
              <PlusIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        {names.isError ? (
          <Button type="button" variant="outline" onClick={names.retry}>
            重新加载状态名称
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={!names.canSave}
            onClick={names.saveNames}
          >
            {names.isSaving ? '保存中…' : '保存状态名称'}
          </Button>
        )}
      </form>

      <div className="space-y-4">
        {options.map((option) => {
          const key = String(option.value)
          const color = draft[key] ?? '#a1a1aa'

          return (
            <div key={key} className="flex flex-wrap items-center justify-between gap-2">
              <Input
                aria-label={`${option.label}的状态名称`}
                value={names.edits[option.value] ?? option.label}
                placeholder={option.label}
                maxLength={GAME_STATUS_NAME_MAX_LENGTH}
                disabled={names.disabled}
                onChange={(event) => names.updateName(option.value, event.target.value)}
                className="max-w-48 min-w-24 flex-1 border"
              />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">{color}</span>
                <AppearanceColorInput
                  aria-label={`${option.label}的状态颜色`}
                  value={color}
                  onChange={(event) => updateDraft(key, event.target.value)}
                  onBlur={() => void confirmColor(key)}
                />
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  disabled={names.disabled}
                  aria-label={`删除状态：${option.label}`}
                  onClick={() => names.requestDelete(option.value)}
                >
                  <Trash2Icon />
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      <AlertDialog
        open={names.deleteName !== undefined}
        onOpenChange={(open) => {
          if (!open && !names.isDeleting) names.requestDelete(undefined)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除游戏状态「{names.deleteName}」？</AlertDialogTitle>
            <AlertDialogDescription>
              使用此状态的所有游戏都会解除绑定，状态将改为「未知」。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={names.isDeleting}>取消</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={names.isDeleting}
              onClick={names.confirmDelete}
            >
              {names.isDeleting ? '删除中…' : '确认删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
