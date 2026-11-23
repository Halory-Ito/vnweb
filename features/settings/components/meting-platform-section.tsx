import { ExternalLink, Music2 } from 'lucide-react'

import { METING_CONFIG_FIELDS } from '../lib/platform-config-fields'
import { PlatformConfigFields } from './platform-config-fields'
import { Button } from '@/components/ui/button'

import type { PlatformSettingsDTO } from '@/lib/settings/platform-settings'

export function MetingPlatformSection({
  values,
  isLoading,
}: {
  values?: PlatformSettingsDTO['meting']
  isLoading: boolean
}) {
  return (
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
          <a href="https://npmx.dev/package/@meting/core" target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            软件包
          </a>
        </Button>
      </div>
      <PlatformConfigFields
        platform="meting"
        fields={METING_CONFIG_FIELDS}
        values={values}
        isLoading={isLoading}
      />
    </section>
  )
}
