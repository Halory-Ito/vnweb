import { GeneralSettings } from '@/features/settings'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '通用设置',
}

export default function GeneralSettingsPage() {
  return <GeneralSettings />
}
