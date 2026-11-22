import DataSettings from '@/features/settings/components/data-settings'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '本地资源数据',
}

export default function RecordDataPage() {
  return <DataSettings />
}
