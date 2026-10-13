'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getAgentConfigApi, saveAgentConfigApi } from '@/api'

import type { AgentConfig } from '@/types/agent'

const AGENT_CONFIG_QUERY_KEY = ['agent', 'config'] as const

const EMPTY_AGENT_CONFIG: AgentConfig = { configs: [], activeConfigId: '' }

/** 读取 / 保存 Agent 模型配置 */
export function useAgentConfig() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: AGENT_CONFIG_QUERY_KEY,
    queryFn: getAgentConfigApi,
  })

  const mutation = useMutation({
    mutationFn: saveAgentConfigApi,
    onSuccess: (data) => {
      queryClient.setQueryData(AGENT_CONFIG_QUERY_KEY, data)
    },
  })

  const save = async (config: AgentConfig) => mutation.mutateAsync(config)

  return {
    config: query.data ?? EMPTY_AGENT_CONFIG,
    isLoading: query.isLoading,
    isSaving: mutation.isPending,
    save,
  }
}
