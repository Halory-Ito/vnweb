'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { GAME_LIBRARY_IMPORT_PROVIDERS } from '../data/game-library-import-providers'
import { importGameLibraryItem, readGameLibrary } from '../lib/game-library-import'
import { useGameLibraryImportList } from './use-game-library-import-list'
import { getThirdPartyAccounts } from '@/lib/platform-account-utils'

import type { GameLibraryImportProvider } from '../data/game-library-import-providers'

export function useGameLibraryImport(
  provider: GameLibraryImportProvider,
  onBusyChange: (busy: boolean) => void,
) {
  const [enteredSteamUid, setSteamUid] = useState<string | null>(null)
  const {
    data,
    isLoading: isLoadingAccounts,
    isError: isAccountsError,
  } = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
    staleTime: 60_000,
  })
  const account = data?.items.find((item) => item.provider.toLowerCase() === provider) ?? null
  const steamUid = enteredSteamUid ?? (provider === 'steam' ? (account?.accountId ?? '') : '')
  const label = GAME_LIBRARY_IMPORT_PROVIDERS.find((item) => item.id === provider)!.label
  const list = useGameLibraryImportList({
    label,
    validateSearch: () => {
      if (provider === 'steam' && !/^\d{17}$/.test(steamUid.trim())) {
        return '请输入有效的 Steam UID（17 位数字）'
      }
      if (provider !== 'steam' && !account) return `请先绑定 ${label} 账号`
      return null
    },
    searchItems: () => readGameLibrary(provider, steamUid.trim()),
    importItem: (item) => importGameLibraryItem(provider, steamUid.trim(), item),
  })

  useEffect(() => {
    onBusyChange(list.isSearching || list.isImporting)
  }, [list.isSearching, list.isImporting, onBusyChange])

  return {
    ...list,
    provider,
    label,
    account,
    isLoadingAccounts,
    isAccountsError,
    steamUid,
    setSteamUid,
  }
}
