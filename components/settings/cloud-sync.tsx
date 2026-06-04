'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  CloudSyncAccountCard,
  type CloudSyncProvider,
} from '@/components/settings/cloud-sync-account-card'
import {
  bindThirdPartyAccount,
  getThirdPartyAccounts,
  type ThirdPartyAccountItem,
  syncSteamPlaytime,
  unlinkThirdPartyAccount,
} from '@/lib/cloud-sync-utils'
import { readProxySettings } from '@/lib/settings/proxy-settings'

const providerConfig: Record<
  CloudSyncProvider,
  {
    label: string
    icon: React.ReactNode
    description: string
    inputPlaceholder: string
  }
> = {
  steam: {
    label: 'Steam',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303a3.01 3.01 0 0 0-3.015-3.015 3.01 3.01 0 0 0-3.015 3.015 3.01 3.01 0 0 0 3.015 3.015 3.01 3.01 0 0 0 3.015-3.015zm-5.273.005c0-1.264 1.029-2.293 2.292-2.293 1.263 0 2.291 1.029 2.291 2.293s-1.028 2.291-2.291 2.291a2.294 2.294 0 0 1-2.292-2.291z" />
      </svg>
    ),
    description: '通过 Steam UID 绑定账号',
    inputPlaceholder: '请输入 17 位 Steam UID',
  },
  bangumi: {
    label: 'Bangumi',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
      </svg>
    ),
    description: '使用 OAuth 授权登录',
    inputPlaceholder: '',
  },
  vndb: {
    label: 'VNDB',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M2 12C2 6.48 6.48 2 12 2s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm11 4v2h-3v-2h3zm0-4v2h-3V8h3zm0-4v2h-3V4h3zm-7 8v2H3v-2h3zm0-4v2H3V8h3zm0-4v2H3V4h3z" />
      </svg>
    ),
    description: '通过 API Token 绑定账号',
    inputPlaceholder: '请输入 VNDB API Token',
  },
  ymgal: {
    label: 'YMGal',
    icon: (
      <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    ),
    description: '通过用户 ID 绑定账号',
    inputPlaceholder: '请输入 YMGal 用户 ID',
  },
}

export default function CloudSync() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [processingProvider, setProcessingProvider] =
    useState<CloudSyncProvider | null>(null)
  const [vndbToken, setVndbToken] = useState('')
  const [steamUid, setSteamUid] = useState('')
  const [ymgalUserId, setYmgalUserId] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  useEffect(() => {
    const provider = (searchParams.get('provider') || '').toLowerCase()
    const status = (searchParams.get('status') || '').toLowerCase()
    const reason = searchParams.get('reason') || ''

    const providerLabels = {
      steam: 'Steam',
      bangumi: 'Bangumi',
      vndb: 'VNDB',
      ymgal: 'YMGal',
    }

    const providerLabel =
      provider === 'steam' ||
      provider === 'bangumi' ||
      provider === 'vndb' ||
      provider === 'ymgal'
        ? providerLabels[provider]
        : ''

    if (!providerLabel || (status !== 'success' && status !== 'failed')) {
      return
    }

    if (status === 'success') {
      toast.success(`${providerLabel} 账号登录成功`)
      void queryClient.invalidateQueries({ queryKey: ['third-party-accounts'] })
      void refetch()
      return
    }

    toast.error(`${providerLabel} 账号登录失败${reason ? `: ${reason}` : ''}`)
  }, [queryClient, refetch, searchParams])

  const accountMap = useMemo(() => {
    const map = new Map<CloudSyncProvider, ThirdPartyAccountItem>()

    for (const item of data?.items ?? []) {
      const provider = item.provider.toLowerCase() as CloudSyncProvider
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

  const startOAuthLogin = (provider: 'bangumi' | 'ymgal') => {
    setProcessingProvider(provider)
    window.location.href = `/api/settings/cloud-sync/auth/${provider}/start`
  }

  const handleBind = async (provider: 'steam' | 'vndb' | 'ymgal') => {
    setProcessingProvider(provider)
    try {
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
        setVndbToken('')
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
        setSteamUid('')
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
        setYmgalUserId('')
      }

      await queryClient.invalidateQueries({
        queryKey: ['third-party-accounts'],
      })
      await refetch()
      toast.success(`${providerConfig[provider].label} 已绑定`)
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

  const handleUnlink = async (provider: CloudSyncProvider) => {
    setProcessingProvider(provider)
    try {
      await unlinkThirdPartyAccount(provider)
      queryClient.setQueryData<{
        items: ThirdPartyAccountItem[]
      }>(['third-party-accounts'], (old) => ({
        items: (old?.items ?? []).filter(
          (item) => item.provider.toLowerCase() !== provider,
        ),
      }))
      toast.success(`${providerConfig[provider].label} 已解绑`)
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
      // 读取代理设置
      const proxySettings = readProxySettings()
      const result = await syncSteamPlaytime(proxySettings)
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

  return (
    <div className="flex flex-col gap-4">
      <CloudSyncAccountCard
        provider="steam"
        config={providerConfig.steam}
        account={accountMap.get('steam')}
        isLoading={isLoading}
        isProcessing={processingProvider === 'steam'}
        onBind={() => void handleBind('steam')}
        onUnlink={() => void handleUnlink('steam')}
        onSyncPlaytime={() => void handleSyncSteamPlaytime()}
        inputValue={steamUid}
        onInputChange={setSteamUid}
      />
      <CloudSyncAccountCard
        provider="bangumi"
        config={providerConfig.bangumi}
        account={accountMap.get('bangumi')}
        isLoading={isLoading}
        isProcessing={processingProvider === 'bangumi'}
        onBind={() => {}}
        onUnlink={() => void handleUnlink('bangumi')}
        onOAuthLogin={() => startOAuthLogin('bangumi')}
        inputValue=""
        onInputChange={() => {}}
        onBindDisabled
      />
      <CloudSyncAccountCard
        provider="vndb"
        config={providerConfig.vndb}
        account={accountMap.get('vndb')}
        isLoading={isLoading}
        isProcessing={processingProvider === 'vndb'}
        onBind={() => void handleBind('vndb')}
        onUnlink={() => void handleUnlink('vndb')}
        inputValue={vndbToken}
        onInputChange={setVndbToken}
        inputType="password"
      />
      <CloudSyncAccountCard
        provider="ymgal"
        config={providerConfig.ymgal}
        account={accountMap.get('ymgal')}
        isLoading={isLoading}
        isProcessing={processingProvider === 'ymgal'}
        onBind={() => void handleBind('ymgal')}
        onUnlink={() => void handleUnlink('ymgal')}
        inputValue={ymgalUserId}
        onInputChange={setYmgalUserId}
      />
    </div>
  )
}
