import { ListChecksIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { useOstBatchDelete } from '../hooks/use-ost-batch-delete'

export function OstBatchDeleteControls({
  batch,
  hasItems,
}: {
  batch: ReturnType<typeof useOstBatchDelete>
  hasItems: boolean
}) {
  if (!batch.active) {
    return (
      <Button type="button" variant="outline" disabled={!hasItems} onClick={batch.enter}>
        <ListChecksIcon />
        批量管理
      </Button>
    )
  }

  return (
    <>
      <span className="text-muted-foreground text-sm" role="status">
        已选 {batch.selectedIds.size} 张
      </span>
      <Button type="button" variant="outline" disabled={!hasItems} onClick={batch.togglePage}>
        {batch.allOnPageSelected ? '取消本页全选' : '全选本页'}
      </Button>
      <Button type="button" variant="outline" onClick={batch.exit}>
        退出多选
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={!batch.selectedIds.size}
        onClick={batch.requestDelete}
      >
        <Trash2Icon />
        批量删除
      </Button>
    </>
  )
}
