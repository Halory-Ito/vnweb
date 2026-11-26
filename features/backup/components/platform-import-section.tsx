'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PlatformImportDialog } from '@/features/game'
import { PLATFORM_IMPORT_SOURCES } from '@/features/game/data/platform-import-sources'

export function PlatformImportSection() {
  return (
    <section
      aria-labelledby="platform-import-settings"
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <h2 id="platform-import-settings" className="text-base font-semibold">
        从其他平台导入
      </h2>
      <div className="space-y-3">
        {PLATFORM_IMPORT_SOURCES.map((source) => (
          <div key={source.id} className="flex min-h-9 items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img
                src={source.logo}
                alt={source.label}
                className="size-4 shrink-0 rounded-xs object-contain"
              />
              <Label>{source.label}</Label>
            </div>
            <PlatformImportDialog initialPlatform={source.id} lockPlatform>
              <Button type="button" variant="outline">
                导入
              </Button>
            </PlatformImportDialog>
          </div>
        ))}
      </div>
    </section>
  )
}
