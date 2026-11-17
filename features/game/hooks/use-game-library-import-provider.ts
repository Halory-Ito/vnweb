'use client'

import { useId, useState } from 'react'

import { GAME_LIBRARY_IMPORT_PROVIDERS } from '../data/game-library-import-providers'
import { useGameImportAvailability } from './use-game-import-availability'

import type { GameLibraryImportProvider } from '../data/game-library-import-providers'

export function useGameLibraryImportProvider(fixedProvider?: GameLibraryImportProvider) {
  const availability = useGameImportAvailability()
  const providerSelectId = useId()
  const [isBusy, setIsBusy] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<GameLibraryImportProvider>('steam')
  const providers = GAME_LIBRARY_IMPORT_PROVIDERS.filter((item) => availability[item.enabledKey])
  const activeProvider =
    fixedProvider ??
    providers.find((item) => item.id === selectedProvider)?.id ??
    providers[0]?.id ??
    'steam'
  const config = GAME_LIBRARY_IMPORT_PROVIDERS.find((item) => item.id === activeProvider)!

  const selectProvider = (value: string) => {
    if (isBusy) return
    const selected = providers.find((item) => item.id === value)
    if (selected) setSelectedProvider(selected.id)
  }

  return { config, providers, selectProvider, providerSelectId, isBusy, setIsBusy }
}
