import { Metadata } from 'next'

import RecordPeriodPanel from '@/features/record/components/record-period-panel'

export const metadata: Metadata = {
  title: '月度游戏报告',
}

export default function MonthRecord() {
  return <RecordPeriodPanel range="month" title="月度游戏报告" />
}
