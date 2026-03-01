import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'vnweb 设置',
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full p-4">
      <h1 className="mb-4 h-full text-2xl font-bold">vnweb 设置</h1>
      {children}
    </div>
  )
}
