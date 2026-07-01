'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/request-utils'

type Subdir = {
  name: string
  path: string
  hasExe: boolean
}

type SubdirSelectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  scannerId: number
  onConfirm: (selectedPaths: string[]) => void
}

export default function SubdirSelectDialog({
  open,
  onOpenChange,
  scannerId,
  onConfirm,
}: SubdirSelectDialogProps) {
  const [subdirs, setSubdirs] = useState<Subdir[]>([])
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [filterText, setFilterText] = useState('')

  useEffect(() => {
    if (open && scannerId) {
      void loadSubdirs()
    }
  }, [open, scannerId])

  const loadSubdirs = async () => {
    setIsLoading(true)
    try {
      const response = await api.get(`/scan/scanner/${scannerId}/subdirs`)
      const data = (response.data as { data: { subdirs: Subdir[] } }).data
      setSubdirs(data.subdirs)
      // 默认全选
      setSelectedPaths(new Set(data.subdirs.map((s) => s.path)))
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '加载子目录失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleSelect = (path: string) => {
    setSelectedPaths((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedPaths(new Set(filteredSubdirs.map((s) => s.path)))
  }

  const handleDeselectAll = () => {
    setSelectedPaths(new Set())
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedPaths))
    onOpenChange(false)
  }

  const filteredSubdirs = subdirs.filter((subdir) =>
    subdir.name.toLowerCase().includes(filterText.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>选择子目录</DialogTitle>
          <DialogDescription>
            选择要扫描的子目录。取消选中的目录将被跳过。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="搜索目录名称..."
          />

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              全选
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeselectAll}
            >
              全不选
            </Button>
            <Badge variant="outline">
              已选 {selectedPaths.size}/{filteredSubdirs.length}
            </Badge>
          </div>

          <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border p-2">
            {isLoading ? (
              <div className="text-muted-foreground py-4 text-center text-sm">
                加载中...
              </div>
            ) : filteredSubdirs.length === 0 ? (
              <div className="text-muted-foreground py-4 text-center text-sm">
                暂无子目录
              </div>
            ) : (
              filteredSubdirs.map((subdir) => (
                <label
                  key={subdir.path}
                  className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded px-2 py-1.5"
                >
                  <input
                    type="checkbox"
                    checked={selectedPaths.has(subdir.path)}
                    onChange={() => handleToggleSelect(subdir.path)}
                    className="size-4"
                  />
                  <span className="flex-1 truncate text-sm">{subdir.name}</span>
                  {subdir.hasExe ? (
                    <Badge variant="secondary" className="text-xs">
                      EXE
                    </Badge>
                  ) : null}
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            disabled={selectedPaths.size === 0}
            onClick={handleConfirm}
          >
            确认扫描选中目录
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
