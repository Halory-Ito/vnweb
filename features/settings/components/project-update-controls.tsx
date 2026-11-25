'use client'

import { RefreshCwIcon } from 'lucide-react'

import { useProjectUpdate } from '../hooks/use-project-update'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

export function ProjectUpdateControls() {
  const { check, isError, isPending, release, statusText } = useProjectUpdate()

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={check}>
        {isPending ? (
          <Spinner data-icon="inline-start" aria-hidden="true" />
        ) : (
          <RefreshCwIcon data-icon="inline-start" aria-hidden="true" />
        )}
        {isPending ? '检查中' : '检查更新'}
      </Button>
      <span role="status" className={cn('text-sm empty:absolute', isError && 'text-destructive')}>
        {statusText}
      </span>
      {release && (
        <a
          href={release.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm underline underline-offset-4"
        >
          {release.tag}
        </a>
      )}
    </div>
  )
}
