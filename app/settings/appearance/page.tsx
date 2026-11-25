import {
  BackgroundSection,
  ChartSection,
  EmptyStateSection,
  FontSection,
  GameCardSection,
  GlassSection,
  GuideSection,
  LayoutSection,
  StartupSection,
  StatusSection,
} from '@/features/appearance'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '外观设置',
}

export default function AppearancePage() {
  return (
    <>
      <div className="space-y-6">
        <LayoutSection />
        <GameCardSection />
        <EmptyStateSection />
        <FontSection />
        <StatusSection />
        <BackgroundSection />
        <StartupSection />
        <GlassSection />
        <ChartSection />
        <GuideSection />
      </div>
    </>
  )
}
