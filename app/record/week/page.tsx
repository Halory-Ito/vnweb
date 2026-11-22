import { Metadata } from 'next'

import RecordPeriodPanel from '@/features/record/components/record-period-panel'

export const metadata: Metadata = {
  title: '周度游戏报告',
}

export default function WeekRecord() {
  return <RecordPeriodPanel range="week" title="周度游戏报告" />
}
