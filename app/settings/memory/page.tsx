import { MemoryMetadataSettings } from '@/features/settings/components/memory-metadata-settings'
import { MemoryPlaybackSettings } from '@/features/settings/components/memory-playback-settings'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '回忆设置',
}

export default function MemorySettingsPage() {
  return (
    <div className="space-y-6">
      <MemoryMetadataSettings />
      <MemoryPlaybackSettings />
    </div>
  )
}
