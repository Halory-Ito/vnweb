'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import { getMemorySettingsApi } from '@/api'
import {
  DEFAULT_MEMORY_METADATA_FIELDS,
  DEFAULT_MEMORY_PLAYBACK_SETTINGS,
} from '@/lib/settings/memory-metadata-settings'

export const MEMORY_METADATA_SETTINGS_QUERY_KEY = ['settings', 'memory-metadata'] as const

export function useMemoryMetadataSettings() {
  const query = useQuery({
    queryKey: MEMORY_METADATA_SETTINGS_QUERY_KEY,
    queryFn: getMemorySettingsApi,
  })

  const fields = query.data?.fields ?? DEFAULT_MEMORY_METADATA_FIELDS
  const playback = query.data?.playback ?? DEFAULT_MEMORY_PLAYBACK_SETTINGS
  const enabledFields = useMemo(() => fields.filter((field) => field.enabled), [fields])

  return {
    ...query,
    fields,
    enabledFields,
    playback,
  }
}
