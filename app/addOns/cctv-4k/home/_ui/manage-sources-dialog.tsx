import { Loader2, Save, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { LiveSource } from '../../utils'

export type EditableSource = {
  id: string
  name: string
  url: string
  priority: string
  icon: string
  valid: boolean
  needProxy: boolean
}

type ManageSourcesDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  sources: LiveSource[]
  isUpdating: boolean
  isBatchDeleting: boolean
  onUpdate: (value: EditableSource) => void
  onBatchDelete: (ids: string[]) => void
}

function toEditableSource(source: LiveSource): EditableSource {
  return {
    id: source.id,
    name: source.name,
    url: source.url,
    priority: String(source.priority),
    icon: source.icon,
    valid: source.valid,
    needProxy: source.needProxy,
  }
}

export function ManageSourcesDialog({
  open,
  onOpenChange,
  sources,
  isUpdating,
  isBatchDeleting,
  onUpdate,
  onBatchDelete,
}: ManageSourcesDialogProps) {
  const [selectedForDelete, setSelectedForDelete] = useState<
    Record<string, boolean>
  >({})
  const [editingId, setEditingId] = useState('')
  const [editingValue, setEditingValue] = useState<EditableSource | null>(null)

  const selectedDeleteIds = useMemo(
    () => Object.keys(selectedForDelete).filter((id) => selectedForDelete[id]),
    [selectedForDelete],
  )

  useEffect(() => {
    if (!open) {
      return
    }

    if (sources.length === 0) {
      setEditingId('')
      setEditingValue(null)
      return
    }

    const fallback = sources[0]
    const target = sources.find((item) => item.id === editingId) ?? fallback
    setEditingId(target.id)
    setEditingValue(toEditableSource(target))
  }, [open, sources, editingId])

  const updateEditingValue = (patch: Partial<EditableSource>) => {
    setEditingValue((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        ...patch,
      }
    })
  }

  const handleSwitchEditTarget = (source: LiveSource) => {
    setEditingId(source.id)
    setEditingValue(toEditableSource(source))
  }

  const handleToggleDeleteTarget = (id: string, checked: boolean) => {
    setSelectedForDelete((prev) => ({
      ...prev,
      [id]: checked,
    }))
  }

  const handleBatchDelete = () => {
    if (selectedDeleteIds.length === 0) {
      return
    }

    if (
      !window.confirm(`确认批量删除 ${selectedDeleteIds.length} 个直播源吗？`)
    ) {
      return
    }

    onBatchDelete(selectedDeleteIds)
  }

  const saveDisabled =
    isUpdating ||
    !editingValue ||
    !editingValue.name.trim() ||
    !editingValue.url.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>管理直播源</DialogTitle>
          <DialogDescription>
            在此统一编辑直播源配置，并支持批量删除。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className="border-border/70 max-h-[58vh] space-y-2 overflow-auto rounded-md border p-2">
            {sources.map((source) => {
              const active = source.id === editingId
              const checked = Boolean(selectedForDelete[source.id])
              return (
                <div
                  key={source.id}
                  className={`rounded-md border p-2 transition ${
                    active ? 'border-red-500 bg-red-500/5' : 'border-border/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        handleToggleDeleteTarget(source.id, Boolean(next))
                      }
                    />
                    <button
                      type="button"
                      className="text-left text-sm font-medium hover:underline"
                      onClick={() => handleSwitchEditTarget(source)}
                    >
                      {source.name}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {editingValue ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>名称</Label>
                <Input
                  value={editingValue.name}
                  onChange={(event) =>
                    updateEditingValue({
                      name: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>链接</Label>
                <Input
                  value={editingValue.url}
                  onChange={(event) =>
                    updateEditingValue({
                      url: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>优先级（仅排序）</Label>
                <Input
                  type="number"
                  value={editingValue.priority}
                  onChange={(event) =>
                    updateEditingValue({
                      priority: event.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Icon（可选）</Label>
                <Input
                  value={editingValue.icon}
                  onChange={(event) =>
                    updateEditingValue({
                      icon: event.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-6">
                <Label className="flex items-center gap-2">
                  <Checkbox
                    checked={editingValue.valid}
                    onCheckedChange={(checked) =>
                      updateEditingValue({
                        valid: Boolean(checked),
                      })
                    }
                  />
                  有效源
                </Label>
                <Label className="flex items-center gap-2">
                  <Checkbox
                    checked={editingValue.needProxy}
                    onCheckedChange={(checked) =>
                      updateEditingValue({
                        needProxy: Boolean(checked),
                      })
                    }
                  />
                  需要代理
                </Label>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">暂无可编辑直播源。</p>
          )}
        </div>

        <DialogFooter className="flex w-full items-center justify-between">
          <Button
            variant="destructive"
            onClick={handleBatchDelete}
            disabled={isBatchDeleting || selectedDeleteIds.length === 0}
          >
            {isBatchDeleting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 size-4" />
            )}
            批量删除（{selectedDeleteIds.length}）
          </Button>

          <Button
            onClick={() => {
              if (editingValue) {
                onUpdate(editingValue)
              }
            }}
            disabled={saveDisabled}
          >
            {isUpdating ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Save className="mr-2 size-4" />
            )}
            保存当前编辑
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
