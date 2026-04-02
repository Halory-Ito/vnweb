import { Plus, Settings2, SlidersHorizontal } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

type TopActionsProps = {
  onOpenCreate: () => void
  onOpenManage: () => void
  hasSources: boolean
}

export function TopActions({
  onOpenCreate,
  onOpenManage,
  hasSources,
}: TopActionsProps) {
  return (
    <Card variant="outline">
      <CardContent className="flex items-center justify-between gap-2 p-4">
        <div className="text-sm">
          <p className="font-medium">CCTV 4K 直播中心</p>
          <p className="text-muted-foreground text-xs">
            选择左侧直播源后自动解析节目，右侧支持频道搜索。
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onOpenCreate}>
            <Plus className="mr-2 size-4" />
            新增直播源
          </Button>

          <Button
            variant="outline"
            onClick={onOpenManage}
            disabled={!hasSources}
          >
            <SlidersHorizontal className="mr-2 size-4" />
            管理直播源
          </Button>

          <Button variant="outline" asChild>
            <Link href="/addOns/cctv-4k/settings">
              <Settings2 className="mr-2 size-4" />
              插件设置
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
