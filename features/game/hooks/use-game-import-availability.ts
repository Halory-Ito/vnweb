'use client'

import { useMemo } from 'react'

import { useEnabledPlatforms } from '@/hooks/use-enabled-platforms'
import { getBulkImportProviders } from '@/lib/providers'
import { isPlatformVisibilityKey } from '@/lib/settings/platform-visibility'

export function useGameImportAvailability() {
  const { isPlatformEnabled } = useEnabledPlatforms()

  return useMemo(() => {
    const enabledIds = getBulkImportProviders()
      .filter((provider) =>
        isPlatformVisibilityKey(provider.id)
          ? isPlatformEnabled(provider.id, 'library-import')
          : true,
      )
      .map((provider) => provider.id)
    const enabledSet = new Set(enabledIds)

    return {
      enabledProviderIds: enabledIds,
      steamEnabled: enabledSet.has('steam'),
      bangumiEnabled: enabledSet.has('bangumi'),
      vndbEnabled: enabledSet.has('vndb'),
      ymgalEnabled: enabledSet.has('ymgal'),
      hasBulkImport: enabledIds.length > 0,
    }
  }, [isPlatformEnabled])
}
