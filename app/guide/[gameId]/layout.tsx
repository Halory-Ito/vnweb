'use client'

import { useParams } from 'next/navigation'

import { useGuideGameBackground } from '@/features/guide/hooks/use-guide-game-background'

import type { ReactNode } from 'react'

export default function GuideGameLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ gameId?: string }>()
  const gameId = Number(params.gameId)

  useGuideGameBackground(gameId)

  return children
}
