import { Loader2, Pencil, Plus } from 'lucide-react'

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

export type SourceFormValue = {
  name: string
  url: string
  priority: string
  icon: string
  valid: boolean
  needProxy: boolean
}

type SourceFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  isPending: boolean
  value: SourceFormValue
  onChange: (next: SourceFormValue) => void
  onSubmit: () => void
}

export function SourceFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  isPending,
  value,
  onChange,
  onSubmit,
}: SourceFormDialogProps) {
  const submitDisabled =
    isPending ||
    !value.name.trim() ||
    !value.url.trim() ||
    !value.priority.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="source-name">名称</Label>
            <Input
              id="source-name"
              placeholder="例如：IPTV 主源"
              value={value.name}
              onChange={(event) =>
                onChange({
                  ...value,
                  name: event.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-url">链接</Label>
            <Input
              id="source-url"
              placeholder="https://example.com/playlist.m3u"
              value={value.url}
              onChange={(event) =>
                onChange({
                  ...value,
                  url: event.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-priority">优先级（仅排序）</Label>
            <Input
              id="source-priority"
              type="number"
              value={value.priority}
              onChange={(event) =>
                onChange({
                  ...value,
                  priority: event.target.value,
                })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="source-icon">Icon（可选）</Label>
            <Input
              id="source-icon"
              placeholder="https://example.com/icon.png"
              value={value.icon}
              onChange={(event) =>
                onChange({
                  ...value,
                  icon: event.target.value,
                })
              }
            />
          </div>
          <div className="flex gap-6">
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={value.valid}
                onCheckedChange={(checked) =>
                  onChange({
                    ...value,
                    valid: Boolean(checked),
                  })
                }
              />
              有效源
            </Label>
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={value.needProxy}
                onCheckedChange={(checked) =>
                  onChange({
                    ...value,
                    needProxy: Boolean(checked),
                  })
                }
              />
              需要代理
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onSubmit} disabled={submitDisabled}>
            {isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : submitLabel.includes('编辑') ? (
              <Pencil className="mr-2 size-4" />
            ) : (
              <Plus className="mr-2 size-4" />
            )}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
