import { Suspense } from 'react'

import CloudSync from '@/features/settings/components/cloud-sync'

function SyncPageContent() {
  return <CloudSync />
}

export default function SyncPage() {
  return (
    <Suspense fallback={null}>
      <SyncPageContent />
    </Suspense>
  )
}
