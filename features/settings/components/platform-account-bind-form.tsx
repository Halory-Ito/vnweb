'use client'

import { Link2, Loader2, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import type { PlatformProvider } from './platform-account-section'

export function AccountBindForm({
  provider,
  inputValue,
  onInputChange,
  inputPlaceholder,
  inputType,
  isProcessing,
  onBind,
  onOAuthLogin,
}: {
  provider: PlatformProvider
  inputValue: string
  onInputChange: (value: string) => void
  inputPlaceholder: string
  inputType: 'text' | 'password'
  isProcessing: boolean
  onBind: () => void | Promise<void>
  onOAuthLogin?: () => void
}) {
  if (provider === 'bangumi' && onOAuthLogin) {
    return (
      <Button type="button" variant="outline" disabled={isProcessing} onClick={onOAuthLogin}>
        {isProcessing ? (
          <>
            <Loader2 className="animate-spin" />
            跳转中...
          </>
        ) : (
          <>
            <Link2 />
            OAuth 授权登录
          </>
        )}
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:max-w-md">
      <Input
        type={inputType}
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder={inputPlaceholder}
        disabled={isProcessing}
        className="min-w-0 flex-1"
      />
      <Button type="button" variant="outline" disabled={isProcessing} onClick={onBind}>
        {isProcessing ? <Loader2 className="animate-spin" /> : <Plus />}
        {isProcessing ? '绑定中...' : '绑定'}
      </Button>
    </div>
  )
}
