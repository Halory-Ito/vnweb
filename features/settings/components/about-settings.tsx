import { ArrowUpRightIcon } from 'lucide-react'
import Image from 'next/image'

import { projectInfo } from '../lib/project-info'
import { ProjectUpdateControls } from './project-update-controls'
import { Badge } from '@/components/ui/badge'

const rowClass =
  'flex min-h-8 min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3'

export function AboutSettings() {
  return (
    <section
      aria-labelledby="about-settings-title"
      className="dark:border-input dark:bg-input/20 flex flex-col gap-4 rounded-xl border p-6"
    >
      <div className="flex items-center gap-3">
        <Image src="/icon.png" alt="" width={32} height={32} unoptimized className="rounded-lg" />
        <h1 id="about-settings-title" className="text-base font-semibold">
          {projectInfo.name}
        </h1>
      </div>
      <dl className="flex min-w-0 flex-col gap-4 text-sm">
        <div className={rowClass}>
          <dt className="shrink-0">项目版本</dt>
          <dd className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end">
            <Badge variant="outline">v{projectInfo.version}</Badge>
            {projectInfo.build && <span>构建 {projectInfo.build}</span>}
            <ProjectUpdateControls />
          </dd>
        </div>
        {projectInfo.links.map(({ label, text, href }) => (
          <div key={label} className={rowClass}>
            <dt className="shrink-0">{label}</dt>
            <dd className="min-w-0 sm:text-right">
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1.5 underline-offset-4 hover:underline"
              >
                <span className="wrap-anywhere">{text}</span>
                <ArrowUpRightIcon
                  aria-hidden="true"
                  className="text-muted-foreground size-3.5 shrink-0"
                />
              </a>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
