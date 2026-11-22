import { Metadata } from 'next'

import RecordOverview from '@/features/record/views/record-overview'

export const metadata: Metadata = {
  title: '数据总览',
}

export default function OverviewPage() {
  return <RecordOverview />
}
