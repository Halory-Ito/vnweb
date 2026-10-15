'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getGoalProgressApi, getGoalSettingsApi, updateGoalSettingsApi } from '@/api'

export function useGoals() {
  const queryClient = useQueryClient()

  const settingsQuery = useQuery({
    queryKey: ['goal-settings'],
    queryFn: getGoalSettingsApi,
    staleTime: 60_000,
  })

  const progressQuery = useQuery({
    queryKey: ['goal-progress'],
    queryFn: getGoalProgressApi,
    staleTime: 30_000,
  })

  const mutation = useMutation({
    mutationFn: updateGoalSettingsApi,
    onSuccess: (data) => {
      queryClient.setQueryData(['goal-settings'], data)
      void queryClient.invalidateQueries({ queryKey: ['goal-progress'] })
      toast.success('目标已更新')
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '更新目标失败')
    },
  })

  return {
    settings: settingsQuery.data,
    progress: progressQuery.data,
    isLoading: settingsQuery.isLoading || progressQuery.isLoading,
    isSaving: mutation.isPending,
    save: (payload: Parameters<typeof updateGoalSettingsApi>[0]) => mutation.mutate(payload),
  }
}
