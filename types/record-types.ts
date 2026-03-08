export type RecordOverviewStats = {
  totalGames: number
  totalPlayTime: number
  totalDays: number
  totalPlayCount: number
  monthlyDurationDistribution: Array<{
    label: string
    hours: number
  }>
  hourlyTimeDistribution: Array<{
    label: string
    hours: number
  }>
  peakHourLabel: string
  playTimeRank: Array<{
    id: string
    cover: string
    title: string
    stat: number
  }>
  ratingRank: Array<{
    id: string
    cover: string
    title: string
    stat: number
  }>
}
