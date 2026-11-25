import { AboutSettings } from '@/features/settings'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '关于 vnweb',
}

export default function AboutSettingsPage() {
  return <AboutSettings />
}
