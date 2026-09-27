'use client'

import { useParams } from 'next/navigation'

import { EndingDetailView } from '@/features/guide/views/ending-detail-view'
import { useRecordVisit } from '@/features/recent'

export default function EndingDetailPage() {
  const params = useParams()
  const gameId = Number(params.gameId)
  const routeId = params.routeId as string
  const endingId = params.endingId as string

  useRecordVisit(gameId, 'guide', `/guide/${gameId}`)

  if (isNaN(gameId)) {
    return <div>无效的游戏ID</div>
  }

  return <EndingDetailView gameId={gameId} routeId={routeId} endingId={endingId} />
}
