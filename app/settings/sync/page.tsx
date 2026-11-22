import { Suspense } from 'react'

import PlatformSettings from '@/features/settings/components/platform-settings'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '平台设置',
}

function SyncPageContent() {
  return <PlatformSettings />
}

export default function SyncPage() {
  return (
    <Suspense fallback={null}>
      <SyncPageContent />
    </Suspense>
  )
}
