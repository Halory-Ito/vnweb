'use client'

import { Calendar, User } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { type ThirdPartyAccountItem } from '@/lib/platform-account-utils'
import { getProxyImageUrl } from '@/lib/proxy-image'

function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export function AccountInfo({ account }: { account: ThirdPartyAccountItem }) {
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

export function AccountCardSkeleton() {
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
