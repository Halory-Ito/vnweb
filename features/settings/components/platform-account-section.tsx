'use client'

import { ExternalLink, Loader2, RefreshCw, Unlink } from 'lucide-react'

import { AccountBindForm } from './platform-account-bind-form'
import { AccountCardSkeleton, AccountInfo } from './platform-account-info'
import {
  PlatformCredentialLink,
  type PlatformCredentialLinkProps,
} from './platform-credential-link'
import { Button } from '@/components/ui/button'
import { type ThirdPartyAccountItem } from '@/lib/platform-account-utils'

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
  inputValue: string
  onInputChange: (value: string) => void
  inputType?: 'text' | 'password'
  onSyncPlaytime?: () => void | Promise<void>
  children?: React.ReactNode
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
        {!config.inputLabel && config.credentialLink && (
          <PlatformCredentialLink {...config.credentialLink} />
        )}
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
          credentialLink={config.credentialLink}
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
