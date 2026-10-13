import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '导出报告',
}

export default function ExportPage() {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-y-scroll p-4">导出报告</div>
  )
}
