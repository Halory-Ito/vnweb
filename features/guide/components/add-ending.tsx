'use client'

import { Flag, Loader2 } from 'lucide-react'

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
import { useAddEndingDialog } from '@/features/guide/hooks/use-add-ending-dialog'

export default function AddEnding() {
  const {
    open,
    handleOpenChange,
    routes,
    name,
    setName,
    type,
    setType,
    selectedRouteId,
    setSelectedRouteId,
    canSubmit,
    isSubmitting,
    submit,
  } = useAddEndingDialog()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 gap-2">
          <Flag className="h-4 w-4" />
          新增结局
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>新增结局</DialogTitle>
          <DialogDescription className="sr-only">选择所属路线并填写结局信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 选择路线 */}
          <div className="space-y-2">
            <Label>所属路线</Label>
            <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择路线" />
              </SelectTrigger>
              <SelectContent>
                {routes.length === 0 ? (
                  <SelectItem value="__empty__" disabled>
                    暂无路线，请先新增路线
                  </SelectItem>
                ) : (
                  routes.map((route) => (
                    <SelectItem key={route.id} value={route.id}>
                      {route.guideName} - {route.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* 结局名称 */}
          <div className="space-y-2">
            <Label>结局名称</Label>
            <Input
              placeholder="输入结局名称..."
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          {/* 结局类型 */}
          <div className="space-y-2">
            <Label>结局类型</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">普通结局</SelectItem>
                <SelectItem value="good">好结局</SelectItem>
                <SelectItem value="bad">坏结局</SelectItem>
                <SelectItem value="true">真结局</SelectItem>
              </SelectContent>
            </Select>
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
              '添加结局'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
