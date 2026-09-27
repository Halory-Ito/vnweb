import {
  BackgroundSection,
  ChartSection,
  FontSection,
  GlassSection,
  GuideSection,
  StatusSection,
} from '@/features/appearance'

export default function AppearancePage() {
  return (
    <>
      <div className="space-y-6">
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
