import RecordNavigation from '@/features/record/components/record-navigation'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: '游戏记录',
}

export const dynamic = 'force-dynamic'

export default function RecordLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[100cqh] w-full min-w-0 space-y-2 overflow-y-auto p-4">
      <RecordNavigation />
      {children}
    </div>
  )
}
