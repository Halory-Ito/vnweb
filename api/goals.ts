import { api } from '@/lib/request-utils'

import type { GoalProgress, GoalSettings } from '@/types'

export const getGoalSettingsApi = async () => {
  const response = await api.get<{ data: GoalSettings }>('/settings/goals')

  return response.data.data
}

export const updateGoalSettingsApi = async (payload: GoalSettings) => {
  const response = await api.post<{ data: GoalSettings }>('/settings/goals', payload)

  return response.data.data
}

export const getGoalProgressApi = async () => {
  const response = await api.get<{ data: GoalProgress }>('/record/goals')

  return response.data.data
}
