'use client'

import { GuideCardList, GuideToolArea } from '@/features/guide'

export default function GuidePage() {
  return (
    <div className="max-h-[calc(100vh-144px)] w-full space-y-4 overflow-y-scroll p-4">
      <GuideToolArea />
      <GuideCardList />
    </div>
  )
}
