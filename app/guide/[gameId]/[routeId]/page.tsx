'use client'

import { useParams } from 'next/navigation'

import { RouteDetailView } from '@/features/guide/views/route-detail-view'

export default function RouteDetailPage() {
  const params = useParams()
  const gameId = Number(params.gameId)
  const routeId = params.routeId as string

  if (isNaN(gameId)) {
    return <div>无效的游戏ID</div>
  }

  return <RouteDetailView gameId={gameId} routeId={routeId} />
}
