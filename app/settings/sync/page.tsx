import { Suspense } from 'react'

import CloudSync from '@/components/settings/cloud-sync'

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
