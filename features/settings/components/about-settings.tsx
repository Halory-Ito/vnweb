import { ArrowUpRightIcon } from 'lucide-react'
import Image from 'next/image'

import { projectInfo } from '../lib/project-info'
import { ProjectUpdateControls } from './project-update-controls'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const rowClass =
  'grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center'

export function AboutSettings() {
  return (
    <Card variant="outline" className="w-full max-w-3xl">
      <CardHeader className="flex items-center gap-3">
        <Image src="/icon.png" alt="" width={44} height={44} unoptimized className="rounded-lg" />
        <CardTitle>
          <h1 className="text-lg">{projectInfo.name}</h1>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="divide-border divide-y text-sm">
          <div className={rowClass}>
            <dt className="text-muted-foreground">项目版本</dt>
            <dd className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
              <Badge variant="outline">v{projectInfo.version}</Badge>
              {projectInfo.build && <span>构建 {projectInfo.build}</span>}
              <ProjectUpdateControls />
            </dd>
          </div>
          {projectInfo.links.map(({ label, text, href }) => (
            <div key={label} className={rowClass}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0">
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
      </CardContent>
    </Card>
  )
}
