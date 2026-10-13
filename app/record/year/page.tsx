import { Metadata } from 'next'

import { RecordPeriodPanel } from '@/features/record'

export const metadata: Metadata = {
  title: '年度游戏报告',
}

export default function YearRecord() {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-y-scroll p-4">
      <RecordPeriodPanel range="year" title="年度游戏报告" />
    </div>
  )
}
