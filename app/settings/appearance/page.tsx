import {
  BackgroundSection,
  ChartSection,
  FontSection,
  GlassSection,
  GuideSection,
} from '@/features/appearance'

export default function AppearancePage() {
  return (
    <>
      <div className="space-y-6">
        <FontSection />
        <BackgroundSection />
        <GlassSection />
        <ChartSection />
        <GuideSection />
      </div>
    </>
  )
}
