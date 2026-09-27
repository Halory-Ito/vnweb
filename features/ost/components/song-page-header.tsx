'use client'

import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'

type SongPageHeaderProps = {
  onCreate: () => void
}

export function SongPageHeader({ onCreate }: SongPageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {/* Placeholder for left side elements if needed */}
      </div>

      <div className="flex items-center gap-2">
        <Button
          onClick={onCreate}
          className="shadow-primary/20 from-primary to-primary/80 bg-linear-to-r transition-all duration-300 hover:scale-105 hover:shadow-lg"
        >
          <PlusIcon className="mr-2 size-4" />
          <span>添加歌曲</span>
        </Button>
      </div>
    </div>
  )
}
