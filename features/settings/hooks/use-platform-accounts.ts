import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  bindThirdPartyAccount,
  getThirdPartyAccounts,
  type ThirdPartyAccountItem,
  syncSteamPlaytime,
  unlinkThirdPartyAccount,
} from '@/lib/platform-account-utils'
import { writePlatformCache } from '@/lib/settings/platform-cache'

import type { PlatformProvider } from '../components/platform-account-section'

export const PLATFORM_LABELS = {
  steam: 'Steam',
  bangumi: 'Bangumi',
  vndb: 'VNDB',
  ymgal: 'YMGal',
} as const

export function usePlatformAccounts() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [processingProvider, setProcessingProvider] = useState<PlatformProvider | null>(null)
  const [bangumiToken, setBangumiToken] = useState('')
  const [vndbToken, setVndbToken] = useState('')
  const [steamUid, setSteamUid] = useState('')
  const [ymgalUserId, setYmgalUserId] = useState('')

  const accountsQuery = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  const { data, refetch } = accountsQuery

  useEffect(() => {
    const provider = (searchParams.get('provider') || '').toLowerCase()
    const status = (searchParams.get('status') || '').toLowerCase()
    const reason = searchParams.get('reason') || ''

    const providerLabel =
      provider === 'steam' || provider === 'vndb' ? PLATFORM_LABELS[provider] : ''

    if (!providerLabel || (status !== 'success' && status !== 'failed')) {
      return
    }

    if (status === 'success') {
      writePlatformCache('accounts', null)
      toast.success(`${providerLabel} 账号登录成功`)
      void refetch()
      return
    }

    toast.error(`${providerLabel} 账号登录失败${reason ? `: ${reason}` : ''}`)
  }, [refetch, searchParams])

  const accountMap = useMemo(() => {
    const map = new Map<PlatformProvider, ThirdPartyAccountItem>()

    for (const item of data?.items ?? []) {
      const provider = item.provider.toLowerCase() as PlatformProvider
      if (
        provider === 'steam' ||
        provider === 'bangumi' ||
        provider === 'vndb' ||
        provider === 'ymgal'
      ) {
        map.set(provider, item)
      }
    }

    return map
  }, [data?.items])

  const startOAuthLogin = (provider: 'steam') => {
    setProcessingProvider(provider)
    window.location.href = `/api/settings/cloud-sync/auth/${provider}/start`
  }

  const handleBind = async (provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal') => {
    setProcessingProvider(provider)
    try {
      if (provider === 'bangumi') {
        const token = bangumiToken.trim()
        if (!token) {
          toast.error('请输入 Bangumi 个人令牌')
          return
        }

        await bindThirdPartyAccount({
          provider,
          accessToken: token,
        })
      }

      if (provider === 'vndb') {
        const token = vndbToken.trim()
        if (!token) {
          toast.error('请输入 VNDB Token')
          return
        }

        await bindThirdPartyAccount({
          provider,
          accessToken: token,
        })
      }

      if (provider === 'steam') {
        const uid = steamUid.trim()
        if (!uid) {
          toast.error('请输入 Steam UID')
          return
        }

        await bindThirdPartyAccount({
          provider,
          accountId: uid,
        })
      }

      if (provider === 'ymgal') {
        const userId = ymgalUserId.trim()
        if (!userId) {
          toast.error('请输入 YMGal 用户 ID')
          return
        }

        await bindThirdPartyAccount({
          provider,
          accountId: userId,
        })
      }

      const result = await refetch()
      if (result.data?.items.some((item) => item.provider.toLowerCase() === provider)) {
        const clearInput: Record<typeof provider, () => void> = {
          bangumi: () => setBangumiToken(''),
          vndb: () => setVndbToken(''),
          steam: () => setSteamUid(''),
          ymgal: () => setYmgalUserId(''),
        }
        clearInput[provider]()
      }
      toast.success(`${PLATFORM_LABELS[provider]} 已绑定`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '绑定失败')
    } finally {
      setProcessingProvider(null)
    }
  }

  const handleUnlink = async (provider: PlatformProvider) => {
    setProcessingProvider(provider)
    try {
      await unlinkThirdPartyAccount(provider)
      queryClient.setQueryData<{
        items: ThirdPartyAccountItem[]
      }>(['third-party-accounts'], (old) => ({
        items: (old?.items ?? []).filter((item) => item.provider.toLowerCase() !== provider),
      }))
      toast.success(`${PLATFORM_LABELS[provider]} 已解绑`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '解绑失败')
    } finally {
      setProcessingProvider(null)
    }
  }

  const handleSyncSteamPlaytime = async () => {
    setProcessingProvider('steam')
    try {
      const result = await syncSteamPlaytime()
      if (result.success) {
        toast.success(result.message || '游戏时长同步成功')
      } else {
        toast.error(result.message || '游戏时长同步失败')
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '同步失败')
    } finally {
      setProcessingProvider(null)
    }
  }

  return {
    accountsQuery,
    accountMap,
    processingProvider,
    steamUid,
    setSteamUid,
    bangumiToken,
    setBangumiToken,
    vndbToken,
    setVndbToken,
    ymgalUserId,
    setYmgalUserId,
    startOAuthLogin,
    handleBind,
    handleUnlink,
    handleSyncSteamPlaytime,
  }
}
