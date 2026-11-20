'use client'

import { GuideCardList, GuideToolArea } from '@/features/guide'

export default function GuidePage() {
  return (
    <div className="max-h-[100cqh] w-full space-y-4 overflow-y-scroll p-4">
      <GuideToolArea />
      <GuideCardList />
    </div>
  )
}
