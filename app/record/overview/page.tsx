import { Metadata } from 'next'

import { RecordOverview } from '@/features/record'

export const metadata: Metadata = {
  title: '数据总览',
}

export default function OverviewPage() {
  return (
    <div className="max-h-[100cqh] w-full space-y-4 overflow-y-scroll p-4">
      <RecordOverview />
    </div>
  )
}
