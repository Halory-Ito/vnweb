'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  bindThirdPartyAccount,
  getThirdPartyAccounts,
  type ThirdPartyAccountItem,
  unlinkThirdPartyAccount,
} from '@/lib/cloud-sync-utils'

type Provider = 'steam' | 'bangumi' | 'vndb'

const providerLabels: Record<Provider, string> = {
  steam: 'Steam',
  bangumi: 'Bangumi',
  vndb: 'VNDB',
}

export default function CloudSync() {
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const [processingProvider, setProcessingProvider] = useState<Provider | null>(
    null,
  )
  const [vndbToken, setVndbToken] = useState('')
  const [steamUid, setSteamUid] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['third-party-accounts'],
    queryFn: getThirdPartyAccounts,
  })

  useEffect(() => {
    const provider = (searchParams.get('provider') || '').toLowerCase()
    const status = (searchParams.get('status') || '').toLowerCase()
    const reason = searchParams.get('reason') || ''

    const providerLabel =
      provider === 'steam' || provider === 'bangumi' || provider === 'vndb'
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
    const map = new Map<Provider, ThirdPartyAccountItem>()

    for (const item of data?.items ?? []) {
      const provider = item.provider.toLowerCase() as Provider
      if (
        provider === 'steam' ||
        provider === 'bangumi' ||
        provider === 'vndb'
      ) {
        map.set(provider, item)
      }
    }

    return map
  }, [data?.items])

  const startOAuthLogin = (provider: 'bangumi') => {
    setProcessingProvider(provider)
    window.location.href = `/api/settings/cloud-sync/auth/${provider}/start`
  }

  const handleBind = async (provider: 'steam' | 'vndb') => {
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

      await queryClient.invalidateQueries({
        queryKey: ['third-party-accounts'],
      })
      await refetch()
      toast.success(`${providerLabels[provider]} 已绑定`)
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

  const handleUnlink = async (provider: Provider) => {
    setProcessingProvider(provider)
    try {
      await unlinkThirdPartyAccount(provider)
      await queryClient.invalidateQueries({
        queryKey: ['third-party-accounts'],
      })
      await refetch()
      toast.success(`${providerLabels[provider]} 已解绑`)
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

  const renderStatus = (provider: Provider) => {
    const account = accountMap.get(provider)
    if (!account) {
      return <div className="text-muted-foreground text-sm">未登录</div>
    }

    const displayName = account.profile?.displayName || account.accountId
    const secondaryName = account.profile?.secondaryName || ''
    const avatar = account.profile?.avatar || ''

    return (
      <div className="bg-muted/30 flex items-center gap-3 rounded-md p-3 text-sm">
        <Avatar size="lg">
          {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
          <AvatarFallback>
            {displayName.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{displayName}</div>
          <div className="text-muted-foreground truncate text-xs">
            {secondaryName}
          </div>
          <div className="text-muted-foreground text-xs">
            登录时间: {account.updatedAt || '-'}
          </div>
          <div className="text-muted-foreground text-xs">
            账号 ID: {account.accountId}
          </div>
          {account.profile?.profileUrl ? (
            <a
              className="text-xs text-blue-600 underline-offset-2 hover:underline"
              href={account.profile.profileUrl}
              target="_blank"
              rel="noreferrer"
            >
              查看主页
            </a>
          ) : null}
        </div>
      </div>
    )
  }

  const renderLoadingSkeleton = () => {
    return (
      <div className="bg-muted/30 flex items-center gap-3 rounded-md p-3 text-sm">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Steam</div>
            {/* <div className="text-muted-foreground text-xs">
              输入 Steam UID 绑定账号
            </div> */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                processingProvider === 'steam' || !accountMap.has('steam')
              }
              onClick={() => void handleUnlink('steam')}
            >
              解绑
            </Button>
          </div>
        </div>
        {isLoading ? (
          renderLoadingSkeleton()
        ) : (
          <div className="space-y-3">
            {accountMap.has('steam') ? renderStatus('steam') : null}
            {!accountMap.has('steam') ? (
              <div className="space-y-2">
                <Input
                  value={steamUid}
                  onChange={(event) => setSteamUid(event.target.value)}
                  placeholder="请输入 17 位 Steam UID"
                  disabled={processingProvider === 'steam'}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={processingProvider === 'steam'}
                  onClick={() => void handleBind('steam')}
                >
                  {processingProvider === 'steam' ? (
                    <>
                      <Loader2 className="mr-1 size-4 animate-spin" /> 绑定中...
                    </>
                  ) : (
                    '绑定 Steam'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Bangumi</div>
            {/* <div className="text-muted-foreground text-xs">
              使用 OAuth 授权码登录并展示账号资料
            </div> */}
          </div>
          <div className="flex items-center gap-2">
            {!accountMap.has('bangumi') && (
              <Button
                type="button"
                variant="outline"
                disabled={processingProvider === 'bangumi'}
                onClick={() => startOAuthLogin('bangumi')}
              >
                {processingProvider === 'bangumi'
                  ? '跳转中...'
                  : '登录 Bangumi'}
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              disabled={
                processingProvider === 'bangumi' || !accountMap.has('bangumi')
              }
              onClick={() => void handleUnlink('bangumi')}
            >
              解绑
            </Button>
          </div>
        </div>
        {isLoading ? renderLoadingSkeleton() : renderStatus('bangumi')}
      </div>

      <div className="space-y-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">VNDB</div>
            {/* <div className="text-muted-foreground text-xs">
              输入 API Token 绑定账号
            </div> */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                processingProvider === 'vndb' || !accountMap.has('vndb')
              }
              onClick={() => void handleUnlink('vndb')}
            >
              解绑
            </Button>
          </div>
        </div>
        {isLoading ? (
          renderLoadingSkeleton()
        ) : (
          <div className="space-y-3">
            {accountMap.has('vndb') ? renderStatus('vndb') : null}
            {!accountMap.has('vndb') ? (
              <div className="space-y-2">
                <Input
                  type="password"
                  value={vndbToken}
                  onChange={(event) => setVndbToken(event.target.value)}
                  placeholder="请输入 VNDB API Token"
                  disabled={processingProvider === 'vndb'}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={processingProvider === 'vndb'}
                  onClick={() => void handleBind('vndb')}
                >
                  {processingProvider === 'vndb' ? (
                    <>
                      <Loader2 className="mr-1 size-4 animate-spin" /> 绑定中...
                    </>
                  ) : (
                    '绑定 VNDB'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
