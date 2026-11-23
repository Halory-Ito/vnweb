'use client'

import { Calendar, ExternalLink, Loader2, RefreshCw, Unlink, User } from 'lucide-react'

import { AccountBindForm } from './platform-account-bind-form'
import {
  PlatformCredentialLink,
  type PlatformCredentialLinkProps,
} from './platform-credential-link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { type ThirdPartyAccountItem } from '@/lib/platform-account-utils'
import { getProxyImageUrl } from '@/lib/proxy-image'

export type PlatformProvider = 'steam' | 'bangumi' | 'vndb' | 'ymgal'

interface PlatformAccountSectionProps {
  provider: PlatformProvider
  config: {
    label: string
    icon: React.ReactNode
    description: string
    inputLabel?: string
    inputPlaceholder: string
    credentialLink?: PlatformCredentialLinkProps
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
  children?: React.ReactNode
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

export function PlatformAccountSection({
  provider,
  config,
  account,
  isLoading,
  isProcessing,
  onBind,
  onUnlink,
  onOAuthLogin,
  inputValue,
  onInputChange,
  inputType = 'text',
  onSyncPlaytime,
  children,
}: PlatformAccountSectionProps) {
  return (
    <section
      aria-labelledby={`platform-section-${provider}`}
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2.5">
        <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md">
          {config.icon}
        </div>
        <h2 id={`platform-section-${provider}`} className="truncate text-base font-semibold">
          {config.label}
        </h2>
        {config.credentialLink && <PlatformCredentialLink {...config.credentialLink} />}
      </div>

      {isLoading ? (
        <AccountCardSkeleton />
      ) : account ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <AccountInfo account={account} />
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
            {provider === 'ymgal' && account.profile?.profileUrl && (
              <Button asChild variant="outline" size="icon-sm">
                <a
                  href={account.profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="打开 YMGal 用户主页"
                  title="打开 YMGal 用户主页"
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              </Button>
            )}
            {provider === 'steam' && onSyncPlaytime && (
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={onSyncPlaytime}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin" />
                    同步中...
                  </>
                ) : (
                  <>
                    <RefreshCw />
                    同步游戏时长
                  </>
                )}
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              disabled={isProcessing}
              onClick={onUnlink}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
            >
              <Unlink />
              解除绑定
            </Button>
          </div>
        </div>
      ) : (
        <AccountBindForm
          provider={provider}
          inputValue={inputValue}
          onInputChange={onInputChange}
          inputLabel={config.inputLabel}
          inputPlaceholder={config.inputPlaceholder}
          inputType={inputType}
          isProcessing={isProcessing}
          onBind={onBind}
          onOAuthLogin={onOAuthLogin}
        />
      )}

      {children ? <div className="border-t pt-4">{children}</div> : null}
    </section>
  )
}

function AccountInfo({ account }: { account: ThirdPartyAccountItem }) {
  const displayName = account.username || account.profile?.displayName || account.accountId
  const avatarUrl = account.avatar || account.profile?.avatar || ''
  const avatar = getProxyImageUrl(avatarUrl)

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="border-border size-9 shrink-0 border">
        {avatar ? <AvatarImage src={avatar} alt={displayName} /> : null}
        <AvatarFallback>{displayName.slice(0, 1).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 space-y-0.5">
        {account.profile?.profileUrl ? (
          <a
            className="block w-fit max-w-full truncate text-sm font-medium underline-offset-4 hover:underline focus-visible:underline"
            href={account.profile.profileUrl}
            target="_blank"
            rel="noreferrer"
          >
            {displayName}
          </a>
        ) : (
          <span className="block truncate text-sm font-medium">{displayName}</span>
        )}
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm">
          <span className="inline-flex items-center gap-1">
            <User className="size-4" />
            {account.accountId}
          </span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="size-4" />
            {formatDate(account.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  )
}

function AccountCardSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="bg-muted size-9 animate-pulse rounded-full" />
      <div className="flex-1 space-y-1.5">
        <div className="bg-muted h-3.5 w-24 animate-pulse rounded" />
        <div className="bg-muted h-3 w-36 animate-pulse rounded" />
      </div>
    </div>
  )
}
