'use client'

import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import { useHydrated } from './use-hydrated'
import { getThirdPartyAccounts } from '@/lib/platform-account-utils'
import {
  getPlatformVisibilityApi,
  isPlatformConfigVisible,
  isPlatformFeatureEnabled,
  type PlatformFeatureCategory,
  type PlatformVisibilityKey,
} from '@/lib/settings/platform-visibility'

type AccountProvider = 'steam' | 'bangumi' | 'vndb' | 'ymgal'

const isAccountProvider = (provider: string): provider is AccountProvider =>
  provider === 'steam' || provider === 'bangumi' || provider === 'vndb' || provider === 'ymgal'

/** 读取「设置 → 平台」的功能分类启用状态；未传分类时判定平台是否至少在一个分类中开启。 */
export function useEnabledPlatforms() {
  const hydrated = useHydrated()
  const visibilityQuery = useQuery({
    queryKey: ['platform-visibility'],
    queryFn: getPlatformVisibilityApi,
  })
  const accountsQuery = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  const { data: rawVisibilityData, isLoading: isLoadingVisibility } = visibilityQuery
  const { data: rawAccountsData, isLoading: isLoadingAccounts } = accountsQuery
  const visibilityData = hydrated ? rawVisibilityData : undefined
  const accountItems = hydrated ? rawAccountsData?.items : undefined

  const boundAccountSet = useMemo(() => {
    const set = new Set<AccountProvider>()
    for (const item of accountItems ?? []) {
      const normalized = item.provider.toLowerCase()
      if (isAccountProvider(normalized)) set.add(normalized)
    }
    return set
  }, [accountItems])

  const isPlatformEnabled = useCallback(
    (key: PlatformVisibilityKey, category?: PlatformFeatureCategory) => {
      const hasBoundAccount = (provider: AccountProvider) => boundAccountSet.has(provider)
      if (category) {
        return isPlatformFeatureEnabled(category, key, visibilityData, hasBoundAccount)
      }
      return isPlatformConfigVisible(key, visibilityData, hasBoundAccount)
    },
    [boundAccountSet, visibilityData],
  )

  return {
    isPlatformEnabled,
    isLoading: !hydrated || isLoadingVisibility || isLoadingAccounts,
  }
}
