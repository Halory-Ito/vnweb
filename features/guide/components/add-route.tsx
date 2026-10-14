'use client'

import { Loader2, Route } from 'lucide-react'

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
import { useAddRouteDialog } from '@/features/guide/hooks/use-add-route-dialog'

export default function AddRoute() {
  const {
    open,
    handleOpenChange,
    guides,
    name,
    setName,
    selectedGuideId,
    setSelectedGuideId,
    canSubmit,
    isSubmitting,
    submit,
  } = useAddRouteDialog()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <Route className="h-4 w-4" />
          新增路线
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增路线</DialogTitle>
          <DialogDescription className="sr-only">选择所属攻略并填写路线信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 选择所属攻略 */}
          <div className="space-y-2">
            <Label>所属攻略</Label>
            <Select value={selectedGuideId} onValueChange={setSelectedGuideId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择攻略" />
              </SelectTrigger>
              <SelectContent>
                {guides.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    暂无攻略，请先导入
                  </SelectItem>
                ) : (
                  guides.map((guide) => (
                    <SelectItem key={guide.id} value={String(guide.id)}>
                      {guide.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 路线名称 */}
          <div className="space-y-2">
            <Label>路线名称</Label>
            <Input
              placeholder="输入路线名称..."
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSubmit && !isSubmitting) {
                  void submit()
                }
              }}
            />
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
              '添加路线'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
