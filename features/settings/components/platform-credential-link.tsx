import { CircleHelp, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type PlatformCredentialLinkProps = {
  href: string
  label: string
  usage: string
  usageLabel: string
}

export function PlatformCredentialLink({
  href,
  label,
  usage,
  usageLabel,
}: PlatformCredentialLinkProps) {
  return (
    <>
      <Button asChild variant="outline" size="icon-xs">
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
          <ExternalLink aria-hidden="true" />
        </a>
      </Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon-xs" aria-label={usageLabel}>
            <CircleHelp aria-hidden="true" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          aria-label={usageLabel}
          className="max-w-[calc(100vw-2rem)] text-sm"
        >
          <p>{usage}</p>
        </PopoverContent>
      </Popover>
    </>
  )
}
