'use client'

import { useParams } from 'next/navigation'

import { RouteDetailView } from '@/features/guide/views/route-detail-view'
import { useRecordVisit } from '@/features/recent'

export default function RouteDetailPage() {
  const params = useParams()
  const gameId = Number(params.gameId)
  const routeId = params.routeId as string

  useRecordVisit(gameId, 'guide', `/guide/${gameId}`)

  if (isNaN(gameId)) {
    return <div>无效的游戏ID</div>
  }

  return <RouteDetailView gameId={gameId} routeId={routeId} />
}
