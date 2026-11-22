import { Metadata } from 'next'

import RecordPeriodPanel from '@/features/record/components/record-period-panel'

export const metadata: Metadata = {
  title: '年度游戏报告',
}

export default function YearRecord() {
  return <RecordPeriodPanel range="year" title="年度游戏报告" />
}
