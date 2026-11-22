'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Music2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { EnhancedPlatformSection } from '@/features/settings/components/enhanced-platform-section'
import {
  PlatformAccountSection,
  type PlatformProvider,
} from '@/features/settings/components/platform-account-section'
import {
  PlatformConfigFields,
  type PlatformFieldSpec,
} from '@/features/settings/components/platform-config-fields'
import {
  bindThirdPartyAccount,
  getThirdPartyAccounts,
  type ThirdPartyAccountItem,
  syncSteamPlaytime,
  unlinkThirdPartyAccount,
} from '@/lib/platform-account-utils'
import {
  BANGUMI_OFFICIAL_API_URL,
  BANGUMI_OFFICIAL_BASE_URL,
} from '@/lib/settings/bangumi-settings'
import { METING_BITRATES, METING_COVER_SIZES } from '@/lib/settings/meting-settings'
import { getPlatformSettingsApi } from '@/lib/settings/platform-settings'
import { readProxySettings } from '@/lib/settings/proxy-settings'

const PLATFORM_CONFIG_FIELDS: Record<PlatformProvider, readonly PlatformFieldSpec[]> = {
  steam: [{ key: 'apiKey', label: 'API Key', placeholder: 'Steam Web API Key' }],
  bangumi: [
    {
      key: 'useMirror',
      label: '接口来源',
      type: 'select',
      options: [
        { value: true, label: '镜像地址' },
        { value: false, label: '官方地址' },
      ],
    },
    {
      key: 'mirrorUrl',
      label: '接口镜像',
      type: 'url',
      placeholder: 'https://bgmapi.anibt.net',
      visibleWhen: ({ useMirror }) => useMirror === true,
    },
    {
      key: 'baseUrl',
      label: '站点镜像',
      type: 'url',
      placeholder: 'https://bgmmi.anibt.net',
      visibleWhen: ({ useMirror }) => useMirror === true,
    },
    {
      key: 'officialApiUrl',
      label: '官方接口',
      type: 'url',
      readOnlyValue: BANGUMI_OFFICIAL_API_URL,
      visibleWhen: ({ useMirror }) => useMirror === false,
    },
    {
      key: 'officialSiteUrl',
      label: '官方站点',
      type: 'url',
      readOnlyValue: BANGUMI_OFFICIAL_BASE_URL,
      visibleWhen: ({ useMirror }) => useMirror === false,
    },
    { key: 'apiKey', label: 'API Key', placeholder: 'Bangumi Access Token' },
    { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: 'Client ID' },
    { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'Client Secret' },
  ],
  vndb: [{ key: 'oauthToken', label: 'API Token', placeholder: 'VNDB Token' }],
  ymgal: [
    { key: 'baseUrl', label: '站点地址', type: 'url', placeholder: 'https://www.ymgal.games' },
    { key: 'clientId', label: 'Client ID', placeholder: 'Client ID' },
    { key: 'clientSecret', label: 'Client Secret', placeholder: 'Client Secret' },
  ],
}

const METING_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'bitrate',
    label: '播放码率',
    type: 'select',
    options: METING_BITRATES.map((value) => ({ value, label: value + ' kbps' })),
  },
  {
    key: 'coverSize',
    label: '封面尺寸',
    type: 'select',
    options: METING_COVER_SIZES.map((value) => ({ value, label: value + ' px' })),
  },
  { key: 'neteaseCookie', label: '网易云 Cookie', type: 'password' },
]

const providerConfig: Record<
  PlatformProvider,
  {
    label: string
    icon: React.ReactNode
    description: string
    inputPlaceholder: string
  }
> = {
  steam: {
    label: 'Steam',
    icon: <img src="/logos/steam.ico" alt="Steam" className="size-4 rounded-xs object-contain" />,
    description: '通过 Steam UID 绑定账号',
    inputPlaceholder: '请输入 17 位 Steam UID',
  },
  bangumi: {
    label: 'Bangumi',
    icon: (
      <img src="/logos/bangumi.ico" alt="Bangumi" className="size-4 rounded-xs object-contain" />
    ),
    description: '使用 OAuth 授权登录',
    inputPlaceholder: '',
  },
  vndb: {
    label: 'VNDB',
    icon: <img src="/logos/vndb.ico" alt="VNDB" className="size-4 rounded-xs object-contain" />,
    description: '通过 API Token 绑定账号',
    inputPlaceholder: '请输入 VNDB API Token',
  },
  ymgal: {
    label: 'YMGal',
    icon: <img src="/logos/ymgal.ico" alt="YMGal" className="size-4 rounded-xs object-contain" />,
    description: '通过用户 ID 绑定账号',
    inputPlaceholder: '请输入 YMGal 用户 ID',
  },
}

export default function PlatformSettings() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [processingProvider, setProcessingProvider] = useState<PlatformProvider | null>(null)
  const [vndbToken, setVndbToken] = useState('')
  const [steamUid, setSteamUid] = useState('')
  const [ymgalUserId, setYmgalUserId] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  const { data: platformSettings, isLoading: isLoadingPlatformSettings } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettingsApi,
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
      provider === 'steam' || provider === 'bangumi' || provider === 'vndb' || provider === 'ymgal'
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

  const handleUnlink = async (provider: PlatformProvider) => {
    setProcessingProvider(provider)
    try {
      await unlinkThirdPartyAccount(provider)
      queryClient.setQueryData<{
        items: ThirdPartyAccountItem[]
      }>(['third-party-accounts'], (old) => ({
        items: (old?.items ?? []).filter((item) => item.provider.toLowerCase() !== provider),
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
    <div className="space-y-6">
      <PlatformAccountSection
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
      >
        <PlatformConfigFields
          platform="steam"
          fields={PLATFORM_CONFIG_FIELDS.steam}
          values={platformSettings?.steam}
          isLoading={isLoadingPlatformSettings}
        />
      </PlatformAccountSection>
      <PlatformAccountSection
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
      >
        <PlatformConfigFields
          platform="bangumi"
          fields={PLATFORM_CONFIG_FIELDS.bangumi}
          values={platformSettings?.bangumi}
          isLoading={isLoadingPlatformSettings}
        />
      </PlatformAccountSection>
      <PlatformAccountSection
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
      >
        <PlatformConfigFields
          platform="vndb"
          fields={PLATFORM_CONFIG_FIELDS.vndb}
          values={platformSettings?.vndb}
          isLoading={isLoadingPlatformSettings}
        />
      </PlatformAccountSection>
      <PlatformAccountSection
        provider="ymgal"
        config={providerConfig.ymgal}
        account={accountMap.get('ymgal')}
        isLoading={isLoading}
        isProcessing={processingProvider === 'ymgal'}
        onBind={() => void handleBind('ymgal')}
        onUnlink={() => void handleUnlink('ymgal')}
        inputValue={ymgalUserId}
        onInputChange={setYmgalUserId}
      >
        <PlatformConfigFields
          platform="ymgal"
          fields={PLATFORM_CONFIG_FIELDS.ymgal}
          values={platformSettings?.ymgal}
          isLoading={isLoadingPlatformSettings}
        />
      </PlatformAccountSection>

      <section
        aria-labelledby="platform-section-meting"
        className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md">
            <Music2 className="size-4" />
          </div>
          <h2 id="platform-section-meting" className="truncate text-base font-semibold">
            Meting SDK
          </h2>
          <Button asChild variant="outline" className="ml-auto">
            <a
              href="https://npmx.dev/package/@meting/core"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink />
              软件包
            </a>
          </Button>
        </div>
        <PlatformConfigFields
          platform="meting"
          fields={METING_CONFIG_FIELDS}
          values={platformSettings?.meting}
          isLoading={isLoadingPlatformSettings}
        />
      </section>

      <EnhancedPlatformSection
        values={platformSettings?.enhanced}
        isLoading={isLoadingPlatformSettings}
      />
    </div>
  )
}
