import { ExternalLink, Image as ImageIcon } from 'lucide-react'

import { PlatformConfigFields } from './platform-config-fields'
import { Button } from '@/components/ui/button'

import type { ImagePlatformSectionMeta } from '../lib/platform-config-fields'
import type { PlatformSettingsDTO } from '@/lib/settings/platform-settings'

/** 渲染单个图片资源平台配置区块。 */
export function ImagePlatformSection({
  section,
  values,
  isLoading,
}: {
  section: ImagePlatformSectionMeta
  values?: PlatformSettingsDTO[ImagePlatformSectionMeta['key']]
  isLoading: boolean
}) {
  return (
    <section
      aria-labelledby={`platform-section-${section.key}`}
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="bg-muted flex size-7 shrink-0 items-center justify-center rounded-md">
          <ImageIcon className="size-4" aria-hidden="true" />
        </div>
        <h2 id={`platform-section-${section.key}`} className="truncate text-base font-semibold">
          {section.title}
        </h2>
        <Button asChild variant="outline" className="ml-auto">
          <a href={section.homepageUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink />
            官网
          </a>
        </Button>
      </div>
      <PlatformConfigFields
        platform={section.key}
        fields={section.fields}
        values={values}
        isLoading={isLoading}
      />
    </section>
  )
}
