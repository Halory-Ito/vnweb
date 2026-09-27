'use client'

import { useParams } from 'next/navigation'

import { GuideDetailView } from '@/features/guide/views/guide-detail-view'
import { useRecordVisit } from '@/features/recent'

export default function GuideDetailPage() {
  const params = useParams()
  const gameId = Number(params.gameId)

  useRecordVisit(gameId, 'guide', `/guide/${gameId}`)

  if (isNaN(gameId)) {
    return <div>无效的游戏ID</div>
  }

  return <GuideDetailView gameId={gameId} />
}
