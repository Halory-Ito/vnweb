import { Tv } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import type { LiveChannel } from '../../utils'
import type { RefObject } from 'react'

type PlayerPanelProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  activeChannel: LiveChannel | undefined
  hasChannels: boolean
  totalLabel: string
}

export function PlayerPanel({
  videoRef,
  activeChannel,
  hasChannels,
  totalLabel,
}: PlayerPanelProps) {
  return (
    <Card variant="outline">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Tv className="size-4 text-red-500" />
          {activeChannel?.name || '直播播放器'}
        </CardTitle>
        <CardDescription>
          {hasChannels
            ? `当前播放：${activeChannel?.name ?? '-'} · ${totalLabel}`
            : '请先选择可用直播源'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted overflow-hidden rounded-lg border">
          <video
            ref={videoRef}
            controls
            playsInline
            className="aspect-video w-full bg-black"
          />
        </div>
      </CardContent>
    </Card>
  )
}
