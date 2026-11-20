import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'vnweb 设置',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-h-[100cqh] w-full overflow-y-scroll p-4">{children}</div>
}
