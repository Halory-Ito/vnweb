'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

import { useEmptyStateSettings } from '@/hooks/use-empty-state-settings'
import { DEFAULT_EMPTY_STATE } from '@/lib/settings/empty-state-settings'
import { cn } from '@/lib/utils'

function pick(items: string[], sample: number) {
  return items[Math.floor(items.length * sample)]
}

export function EmptyArtwork({ className }: { className?: string }) {
  const settings = useEmptyStateSettings()
  const [sample, setSample] = useState(0)
  const [failedImage, setFailedImage] = useState<string>()

  useEffect(() => {
    setSample(Math.random())
  }, [])

  const image = settings.mode === 'image' ? pick(settings.images, sample) : undefined
  const text = pick(
    settings.kaomoji.length ? settings.kaomoji : DEFAULT_EMPTY_STATE.kaomoji,
    sample,
  )

  return (
    <div
      aria-hidden="true"
      className={cn('text-muted-foreground flex max-w-full justify-center', className)}
    >
      {image && image !== failedImage ? (
        <Image
          unoptimized
          alt=""
          src={image}
          width={128}
          height={96}
          referrerPolicy="no-referrer"
          className="h-24 max-w-full rounded-md object-contain"
          onError={() => setFailedImage(image)}
        />
      ) : (
        <span className="max-w-full text-lg leading-relaxed wrap-anywhere">{text}</span>
      )}
    </div>
  )
}
