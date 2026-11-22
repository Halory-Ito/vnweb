import {
  BackgroundSection,
  ChartSection,
  EmptyStateSection,
  FontSection,
  GameCardSection,
  GlassSection,
  GuideSection,
  LayoutSection,
  StatusSection,
} from '@/features/appearance'

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
        <GlassSection />
        <ChartSection />
        <GuideSection />
      </div>
    </>
  )
}
