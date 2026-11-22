import { ArrowLeftIcon } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export default function LibraryFolderHeader({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <Button asChild variant="outline" size="icon" aria-label="返回游戏库">
        <Link href="/game/home">
          <ArrowLeftIcon />
        </Link>
      </Button>
      <h1 className="mr-auto min-w-0 text-lg font-bold wrap-anywhere">{title}</h1>
      {children}
    </div>
  )
}
