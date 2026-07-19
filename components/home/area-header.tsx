import { Badge } from '@/components/ui/badge'

import type { LucideIcon } from 'lucide-react'

type AreaHeader = {
  icon: LucideIcon
  title: string
  count: number
}

export default function AreaHeader({ icon: Icon, title, count }: AreaHeader) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={24} />
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold">{title}</div>
        <div>
          <Badge variant="outline" className="m-0">
            共 {count} 项
          </Badge>
        </div>
      </div>
    </div>
  )
}
