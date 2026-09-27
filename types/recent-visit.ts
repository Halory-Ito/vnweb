export const RECENT_VISIT_TYPES = ['detail', 'guide', 'ost', 'memory'] as const

export type RecentVisitType = (typeof RECENT_VISIT_TYPES)[number]

export type RecentVisitItem = {
  id: number
  gameId: number
  type: RecentVisitType
  href: string
  visitedAt: string
  gameName: string
  gameNameCn: string
  gameCover: string
}
