'use client'

import { ExternalLink } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { type ThirdPartyAccountItem } from '@/lib/cloud-sync-utils'
import { getProxyImageUrl } from '@/lib/proxy-image'

export type CloudSyncProvider = 'steam' | 'bangumi' | 'vndb' | 'ymgal'

interface CloudSyncAccountCardProps {
  provider: CloudSyncProvider
  config: {
    label: string
    icon: React.ReactNode
    description: string
    inputPlaceholder: string
  }
  account: ThirdPartyAccountItem | undefined
  isLoading: boolean
  isProcessing: boolean
  onBind: () => void | Promise<void>
  onUnlink: () => void | Promise<void>
  onOAuthLogin?: () => void
  onBindDisabled?: boolean
  inputValue: string
  onInputChange: (value: string) => void
  inputType?: 'text' | 'password'
  onSyncPlaytime?: () => void | Promise<void>
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function CloudSyncAccountCard({
  provider,
  config,
  account,
  isLoading,
  isProcessing,
  onBind,
  onUnlink,
  onOAuthLogin,
  onBindDisabled,
  inputValue,
  onInputChange,
  inputType = 'text',
  onSyncPlaytime,
}: CloudSyncAccountCardProps) {
  const isBound = !!account
  const isSteam = provider === 'steam'

  return (
    <Card variant="outline" className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
            {config.icon}
          </div>
          <div className="flex-1">
            <CardTitle>{config.label}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
          </div>
        </div>
        <CardAction>
          <Badge variant={isBound ? 'default' : 'outline'} className="gap-1">
            {isBound ? (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="size-3"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                已绑定
              </>
            ) : (
              '未绑定'
            )}
          </Badge>
        </CardAction>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4">
        {isLoading ? (
          <AccountCardSkeleton />
        ) : isBound ? (
          <>
            <AccountInfo account={account} />
            <div className="mt-4 flex items-center justify-between">
              {isSteam && onSyncPlaytime && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isProcessing}
                  onClick={onSyncPlaytime}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4 animate-spin"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      同步中...
                    </>
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        className="size-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                        <path d="M21 3v5h-5" />
                      </svg>
                      同步游戏时长
                    </>
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isProcessing}
                onClick={onUnlink}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/5 ml-auto"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18.84 12.25l1.72-1.71h-.02a5.004 5.004 0 0 0-.12-7.07 5.006 5.006 0 0 0-6.95 0l-1.72 1.71" />
                  <path d="M5.17 11.75l-1.71 1.71a5.004 5.004 0 0 0 .12 7.07 5.006 5.006 0 0 0 6.95 0l1.71-1.71" />
                  <line x1="8" y1="2" x2="8" y2="5" />
                  <line x1="2" y1="8" x2="5" y2="8" />
                  <line x1="16" y1="19" x2="16" y2="22" />
                  <line x1="19" y1="16" x2="22" y2="16" />
                </svg>
                解除绑定
              </Button>
            </div>
          </>
        ) : (
          <AccountBindForm
            provider={provider}
            inputValue={inputValue}
            onInputChange={onInputChange}
            inputPlaceholder={config.inputPlaceholder}
            inputType={inputType}
            isProcessing={isProcessing}
            onBind={onBind}
            onOAuthLogin={onOAuthLogin}
            onBindDisabled={onBindDisabled}
          />
        )}
      </CardContent>
    </Card>
  )
}

function AccountInfo({ account }: { account: ThirdPartyAccountItem }) {
  const displayName = account.username || account.profile?.displayName || account.accountId
  const secondaryName = account.profile?.secondaryName || ''
  const avatarUrl = account.avatar || account.profile?.avatar || ''
  const avatar = getProxyImageUrl(avatarUrl)

  return (
    <div className="flex items-start gap-4">
      <Avatar className="border-border size-14 shrink-0 border">
        {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
        <AvatarFallback className="text-base">
          {displayName.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="leading-tight font-medium">{displayName}</div>
        {secondaryName && (
          <div className="text-muted-foreground text-sm leading-tight">{secondaryName}</div>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <svg
              viewBox="0 0 24 24"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formatDate(account.updatedAt)}
          </div>
          <div className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
            <svg
              viewBox="0 0 24 24"
              className="size-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {account.accountId}
          </div>
        </div>
        {account.profile?.profileUrl && (
          <a
            className="text-primary inline-flex items-center gap-1 text-xs transition-colors hover:underline"
            href={account.profile.profileUrl}
            target="_blank"
            rel="noreferrer"
          >
            查看主页
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function AccountBindForm({
  provider,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputType,
  isProcessing,
  onBind,
  onOAuthLogin,
}: {
  provider: CloudSyncProvider
  inputValue: string
  onInputChange: (value: string) => void
  inputPlaceholder: string
  inputType: 'text' | 'password'
  isProcessing: boolean
  onBind: () => void | Promise<void>
  onOAuthLogin?: () => void
  onBindDisabled?: boolean
}) {
  if (provider === 'bangumi' && onOAuthLogin) {
    return (
      <div className="flex items-center gap-3">
        <div className="bg-muted/50 flex flex-1 items-center gap-2 rounded-md border border-dashed px-3 py-2">
          <svg
            viewBox="0 0 24 24"
            className="text-muted-foreground size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="text-muted-foreground text-sm">OAuth 授权登录</span>
        </div>
        <Button type="button" variant="outline" disabled={isProcessing} onClick={onOAuthLogin}>
          {isProcessing ? (
            <>
              <svg
                viewBox="0 0 24 24"
                className="size-4 animate-spin"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              跳转中...
            </>
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              登录 Bangumi
            </>
          )}
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <input
          type={inputType}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={inputPlaceholder}
          disabled={isProcessing}
          className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>
      <Button type="button" variant="outline" disabled={isProcessing} onClick={onBind}>
        {isProcessing ? (
          <>
            <svg
              viewBox="0 0 24 24"
              className="size-4 animate-spin"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            绑定中...
          </>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            绑定
          </>
        )}
      </Button>
    </div>
  )
}

function AccountCardSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <div className="bg-muted size-14 animate-pulse rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="bg-muted h-4 w-32 animate-pulse rounded" />
        <div className="bg-muted h-3 w-24 animate-pulse rounded" />
        <div className="flex gap-4">
          <div className="bg-muted h-3 w-24 animate-pulse rounded" />
          <div className="bg-muted h-3 w-20 animate-pulse rounded" />
        </div>
      </div>
    </div>
  )
}
