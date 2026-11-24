'use client'

import { Link2, Loader2, Plus } from 'lucide-react'
import { useId } from 'react'

import {
  PlatformCredentialLink,
  type PlatformCredentialLinkProps,
} from './platform-credential-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { PlatformProvider } from './platform-account-section'

export function AccountBindForm({
  provider,
  inputValue,
  onInputChange,
  inputLabel,
  credentialLink,
  inputPlaceholder,
  inputType,
  isProcessing,
  onBind,
  onOAuthLogin,
}: {
  provider: PlatformProvider
  inputValue: string
  onInputChange: (value: string) => void
  inputLabel?: string
  credentialLink?: PlatformCredentialLinkProps
  inputPlaceholder: string
  inputType: 'text' | 'password'
  isProcessing: boolean
  onBind: () => void | Promise<void>
  onOAuthLogin?: () => void
}) {
  const inputId = useId()

  const input = (
    <Input
      id={inputId}
      type={inputType}
      autoComplete={inputType === 'password' ? 'off' : undefined}
      value={inputValue}
      onChange={(e) => onInputChange(e.target.value)}
      placeholder={inputPlaceholder}
      disabled={isProcessing}
      className={inputLabel ? 'w-full sm:max-w-md' : 'min-w-0 flex-1'}
    />
  )
  const bindButton = (
    <Button type="button" variant="outline" disabled={isProcessing} onClick={onBind}>
      {isProcessing ? <Loader2 className="animate-spin" /> : <Plus />}
      {isProcessing ? '绑定中...' : '绑定'}
    </Button>
  )

  if (inputLabel) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label htmlFor={inputId}>{inputLabel}</Label>
            {credentialLink && <PlatformCredentialLink {...credentialLink} />}
          </div>
          {input}
        </div>
        <div className="flex justify-end pt-1">{bindButton}</div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex w-full items-center gap-2 sm:max-w-md">
        {input}
        {bindButton}
      </div>
      {provider === 'steam' && onOAuthLogin && (
        <Button type="button" variant="outline" disabled={isProcessing} onClick={onOAuthLogin}>
          <Link2 aria-hidden="true" />
          通过 Steam 登录
        </Button>
      )}
    </div>
  )
}
