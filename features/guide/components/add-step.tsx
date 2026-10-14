'use client'

import { Footprints, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddStepDialog } from '@/features/guide/hooks/use-add-step-dialog'

const STEP_TYPE_OPTIONS = [
  { value: 'choice', label: '选项' },
  { value: 'save', label: '存档' },
  { value: 'load', label: '读档' },
  { value: 'note', label: '备注' },
]

export default function AddStep() {
  const { open, handleOpenChange, endings, form, setField, canSubmit, isSubmitting, submit } =
    useAddStepDialog()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <Footprints className="h-4 w-4" />
          新增步骤
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增步骤</DialogTitle>
          <DialogDescription className="sr-only">
            选择所属结局并填写步骤类型与内容
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 选择结局 */}
          <div className="space-y-2">
            <Label>所属结局</Label>
            <Select value={form.endingId} onValueChange={(value) => setField('endingId', value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择结局" />
              </SelectTrigger>
              <SelectContent>
                {endings.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    暂无结局，请先新增结局
                  </SelectItem>
                ) : (
                  endings.map((ending) => (
                    <SelectItem key={ending.id} value={ending.id}>
                      {ending.guideName} - {ending.routeName} - {ending.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 步骤类型 */}
          <div className="space-y-2">
            <Label>步骤类型</Label>
            <Select value={form.type} onValueChange={(value) => setField('type', value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STEP_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 步骤内容 */}
          <div className="space-y-2">
            <Label>步骤内容</Label>
            <Input
              placeholder="输入步骤内容..."
              value={form.content}
              onChange={(event) => setField('content', event.target.value)}
            />
          </div>

          {/* 分组（可选） */}
          <div className="space-y-2">
            <Label>
              分组 <span className="text-muted-foreground">(可选)</span>
            </Label>
            <Input
              placeholder="例如：7月15日"
              value={form.group}
              onChange={(event) => setField('group', event.target.value)}
            />
          </div>

          {/* 前缀和后缀 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                前缀 <span className="text-muted-foreground">(可选)</span>
              </Label>
              <Input
                placeholder="例如：★"
                value={form.prefix}
                onChange={(event) => setField('prefix', event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>
                后缀 <span className="text-muted-foreground">(可选)</span>
              </Label>
              <Input
                placeholder="输入后缀..."
                value={form.subfix}
                onChange={(event) => setField('subfix', event.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                添加中...
              </>
            ) : (
              '添加步骤'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
