import { Metadata } from 'next'

import RecordExportPanel from '@/features/record/components/record-export-panel'

export const metadata: Metadata = {
  title: '导出报告',
}

export default function ExportPage() {
  return <RecordExportPanel />
}
