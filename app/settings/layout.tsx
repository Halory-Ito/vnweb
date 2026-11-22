import SettingsNavigation from '@/features/settings/components/settings-navigation'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'vnweb 设置',
}

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="max-h-[100cqh] w-full min-w-0 space-y-2 overflow-y-auto p-4">
      <SettingsNavigation />
      {children}
    </div>
  )
}
