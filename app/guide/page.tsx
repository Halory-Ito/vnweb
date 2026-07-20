'use client'

import GuideToolArea from '@/features/guide/views/guide-tool-area'

export default function GuidePage() {
  return (
    <div className="max-h-[calc(100vh-144px)] w-full space-y-4 overflow-y-scroll p-4">
      <GuideToolArea />
    </div>
  )
}
