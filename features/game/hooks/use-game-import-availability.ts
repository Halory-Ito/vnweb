'use client'

import { getBulkImportProviders } from '@/lib/providers'

export function useGameImportAvailability() {
  const enabledIds = getBulkImportProviders().map((provider) => provider.id)
  const enabledSet = new Set(enabledIds)

  return {
    enabledProviderIds: enabledIds,
    steamEnabled: enabledSet.has('steam'),
    bangumiEnabled: enabledSet.has('bangumi'),
    vndbEnabled: enabledSet.has('vndb'),
    ymgalEnabled: enabledSet.has('ymgal'),
    hasBulkImport: enabledIds.length > 0,
  }
}
