import { api } from '@/lib/request-utils'

import type {
  RecordHeatmapPeriods,
  RecordOverviewStats,
  RecordPlayHeatmap,
  RecordPlayHeatmapMonth,
} from '@/types'

export const getRecordOverviewStatsApi = async () => {
  const response = await api.get<{ data: RecordOverviewStats }>('/record/overview/stats')

  return response.data.data
}

export const getPlayHeatmapApi = async (days = 365) => {
  const response = await api.get<{ data: RecordPlayHeatmap }>('/record/heatmap', {
    params: { days },
  })

  return response.data.data
}

export const getPlayHeatmapPeriodsApi = async () => {
  const response = await api.get<{ data: RecordHeatmapPeriods }>('/record/heatmap/periods')

  return response.data.data
}

export const getPlayHeatmapMonthApi = async (params?: { year?: number; month?: number }) => {
  const response = await api.get<{ data: RecordPlayHeatmapMonth }>('/record/heatmap/month', {
    params: {
      year: params?.year ?? '',
      month: params?.month ?? '',
    },
  })

  return response.data.data
}
