import { bangumiProvider } from './bangumi-provider'
import {
  bangumiCharacterProviderInfo,
  vndbCharacterProviderInfo,
  ymgalCharacterProviderInfo,
} from './characters/metadata'
import { steamProvider } from './steam-provider'
import { steamgriddbProvider } from './steamgriddb-provider'
import { vndbProvider } from './vndb-provider'
import { ymgalProvider } from './ymgal-provider'

import type { GameProvider, ProviderCapability } from './types'

const GAME_PROVIDERS: readonly GameProvider[] = [
  bangumiProvider,
  steamProvider,
  steamgriddbProvider,
  vndbProvider,
  ymgalProvider,
]

export function getAllProviders(): Array<GameProvider & { enabled: boolean }> {
  return GAME_PROVIDERS.map((provider) => ({ ...provider, enabled: true }))
}

export function getEnabledProviders(): GameProvider[] {
  return [...GAME_PROVIDERS]
}

export function getProviderById(id: string): GameProvider | undefined {
  return GAME_PROVIDERS.find((provider) => provider.id === id)
}

export function getProvidersByCapability(capability: ProviderCapability): GameProvider[] {
  return GAME_PROVIDERS.filter((provider) => provider.capabilities.includes(capability))
}

export function getManualSearchProviderOptions() {
  return getProvidersByCapability('manual-search').map((provider) => ({
    value: provider.id,
    label: provider.name,
  }))
}

export function getBulkImportProviders(): GameProvider[] {
  return getProvidersByCapability('bulk-import')
}

export function getAccountBindProviders(): GameProvider[] {
  return getProvidersByCapability('account-bind')
}

export function getCharacterProviders() {
  return [vndbCharacterProviderInfo, bangumiCharacterProviderInfo, ymgalCharacterProviderInfo]
}
