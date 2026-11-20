import {
  BackgroundSection,
  ChartSection,
  FontSection,
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
