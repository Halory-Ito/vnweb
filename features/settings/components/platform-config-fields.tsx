'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'

import {
  PlatformCredentialLink,
  type PlatformCredentialLinkProps,
} from './platform-credential-link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  updatePlatformSettingsApi,
  type PlatformKey,
  type PlatformSettingsDTO,
} from '@/lib/settings/platform-settings'

export type PlatformFieldSpec = {
  key: string
  label: string
  type?: 'text' | 'url' | 'password' | 'select'
  credentialLink?: PlatformCredentialLinkProps
  placeholder?: string
  readOnlyValue?: string
  options?: readonly { value: PlatformFieldValue; label: string }[]
  visibleWhen?: (draft: Record<string, PlatformFieldValue>) => boolean
}

type PlatformFieldValue = string | boolean | number

type PlatformConfigFieldsProps<K extends PlatformKey> = {
  platform: K
  fields: readonly PlatformFieldSpec[]
  values?: Record<string, PlatformFieldValue>
  isLoading?: boolean
}

export function PlatformConfigFields<K extends PlatformKey>({
  platform,
  fields,
  values,
  isLoading,
}: PlatformConfigFieldsProps<K>) {
  const baseId = useId()
  const queryClient = useQueryClient()
  const [edits, setEdits] = useState<Record<string, PlatformFieldValue>>({})
  const draft = { ...values, ...edits }

  const saveMutation = useMutation({
    mutationFn: (nextConfig: Record<string, PlatformFieldValue>) =>
      updatePlatformSettingsApi(platform, nextConfig as Partial<PlatformSettingsDTO[K]>),
    onSuccess: (updated) => {
      setEdits({})
      queryClient.setQueryData<PlatformSettingsDTO>(['platform-settings'], (current) =>
        current ? { ...current, [platform]: updated[platform] } : updated,
      )
      void queryClient.invalidateQueries({ queryKey: ['platform-settings'] })
      toast.success('平台配置已保存')
    },
    onError: (error) => {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '保存失败')
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const config: Record<string, PlatformFieldValue> = {}
    for (const field of fields) {
      if (field.readOnlyValue !== undefined || field.visibleWhen?.(draft) === false) continue
      const value = edits[field.key]
      if (value !== undefined) config[field.key] = value
    }
    if (values && Object.keys(config).length > 0) saveMutation.mutate(config)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {fields.map((field) => {
        if (field.visibleWhen && !field.visibleWhen(draft)) return null
        const inputId = `${baseId}-${field.key}`

        return (
          <div
            key={field.key}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Label htmlFor={inputId}>{field.label}</Label>
              {field.credentialLink && <PlatformCredentialLink {...field.credentialLink} />}
            </div>
            {field.type === 'select' ? (
              <Select
                value={String(draft[field.key] ?? '')}
                disabled={isLoading || !values || saveMutation.isPending}
                onValueChange={(value) => {
                  const option = field.options?.find((item) => String(item.value) === value)
                  if (option) setEdits((prev) => ({ ...prev, [field.key]: option.value }))
                }}
              >
                <SelectTrigger id={inputId} className="w-full sm:max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(({ value, label }) => (
                    <SelectItem key={String(value)} value={String(value)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={inputId}
                type={field.type ?? 'text'}
                autoComplete={field.type === 'password' ? 'off' : undefined}
                value={field.readOnlyValue ?? String(draft[field.key] ?? '')}
                readOnly={field.readOnlyValue !== undefined}
                onChange={(event) =>
                  setEdits((prev) => ({ ...prev, [field.key]: event.target.value }))
                }
                placeholder={field.placeholder}
                disabled={isLoading || !values || saveMutation.isPending}
                className="w-full sm:max-w-md"
              />
            )}
          </div>
        )
      })}
      <div className="flex justify-end pt-1">
        <Button
          type="submit"
          variant="outline"
          disabled={
            isLoading || !values || saveMutation.isPending || Object.keys(edits).length === 0
          }
        >
          {saveMutation.isPending ? <Loader2 className="animate-spin" /> : '保存配置'}
        </Button>
      </div>
    </form>
  )
}
