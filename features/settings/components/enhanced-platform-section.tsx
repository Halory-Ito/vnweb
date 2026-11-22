'use client'

import { Disc3, ExternalLink } from 'lucide-react'

import { NeteaseSdkControls } from './netease-sdk-controls'
import { PlatformConfigFields, type PlatformFieldSpec } from './platform-config-fields'
import { Button } from '@/components/ui/button'
import { ENHANCED_QUALITY_OPTIONS } from '@/lib/settings/enhanced-quality'

import type { PlatformSettingsDTO } from '@/lib/settings/platform-settings'

const ENHANCED_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'useLocalSdk',
    label: '调用方式',
    type: 'select',
    options: [
      { value: false, label: '外部 API' },
      { value: true, label: '本地 SDK' },
    ],
  },
  {
    key: 'apiBase',
    label: '外部接口地址',
    type: 'url',
    placeholder: 'https://music.163.com/api',
    visibleWhen: ({ useLocalSdk }) => useLocalSdk === false,
  },
  {
    key: 'quality',
    label: '默认音质',
    type: 'select',
    options: ENHANCED_QUALITY_OPTIONS,
  },
  {
    key: 'musicU',
    label: 'MUSIC_U',
    type: 'password',
    placeholder: '网易云 Cookie 中的 MUSIC_U 值',
  },
]

export function EnhancedPlatformSection({
  values,
  isLoading,
}: {
  values?: PlatformSettingsDTO['enhanced']
  isLoading: boolean
}) {
  return (
    <section
      aria-labelledby="platform-section-netease"
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md">
          <Disc3 className="size-4" />
        </div>
        <h2 id="platform-section-netease" className="truncate text-base font-semibold">
          网易云 Enhanced API
        </h2>
        <Button asChild variant="outline" className="ml-auto">
          <a
            href="https://github.com/neteasecloudmusicapienhanced/api-enhanced"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink />
            仓库
          </a>
        </Button>
      </div>
      <PlatformConfigFields
        platform="enhanced"
        fields={ENHANCED_CONFIG_FIELDS}
        values={values}
        isLoading={isLoading}
        renderAfterForm={({ useLocalSdk }) =>
          useLocalSdk === true && (
            <div className="border-t pt-4">
              <NeteaseSdkControls />
            </div>
          )
        }
      />
    </section>
  )
}
