export type RecordPlayHeatmapDay = {
  date: string
  seconds: number
  hours: number
}

export type RecordPlayHeatmap = {
  startDate: string
  endDate: string
  days: RecordPlayHeatmapDay[]
  totalSeconds: number
  totalHours: number
  activeDays: number
}

export type RecordHeatmapPeriod = {
  year: number
  months: number[]
}

export type RecordHeatmapPeriods = {
  periods: RecordHeatmapPeriod[]
  latest: { year: number; month: number } | null
}

export type RecordPlayHeatmapMonth = {
  year: number
  month: number
  days: RecordPlayHeatmapDay[]
  totalSeconds: number
  totalHours: number
  activeDays: number
}

export type RecordOverviewStats = {
  totalGames: number
  totalPlayTime: number
  totalDays: number
  totalPlayCount: number
  totalCharacters: number
  totalOsts: number
  totalPvs: number
  totalQuotes: number
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
