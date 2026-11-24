'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { saveMemoryPlaybackSettingsApi } from '@/api'
import {
  MEMORY_METADATA_SETTINGS_QUERY_KEY,
  useMemoryMetadataSettings,
} from '@/hooks/use-memory-metadata-settings'

import type { MemoryPlaybackSettings } from '@/lib/settings/memory-metadata-settings'

export function useMemoryPlaybackSettings() {
  const queryClient = useQueryClient()
  const { playback, isLoading } = useMemoryMetadataSettings()
  const [isSaving, setIsSaving] = useState(false)

  const updatePlayback = async (patch: Partial<MemoryPlaybackSettings>) => {
    const next: MemoryPlaybackSettings = {
      ...playback,
      ...patch,
    }
    setIsSaving(true)
    try {
      const saved = await saveMemoryPlaybackSettingsApi(next)
      queryClient.setQueryData(MEMORY_METADATA_SETTINGS_QUERY_KEY, saved)
      toast.success('播放设置已保存')
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '保存播放设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  return {
    playback,
    isLoading,
    isSaving,
    updatePlayback,
  }
}
