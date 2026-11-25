'use client'

import { CopyIcon, MinusIcon, SquareIcon, XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export default function WindowControls({
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: {
  isMaximized: boolean
  onMinimize: () => void
  onToggleMaximize: () => void
  onClose: () => void
}) {
  return (
    <div
      data-no-drag
      className="border-border/60 flex shrink-0 items-center gap-1.5 border-l pl-2 md:pl-3"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="最小化"
            onClick={onMinimize}
          >
            <MinusIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>最小化</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={isMaximized ? '还原窗口' : '最大化'}
            onClick={onToggleMaximize}
          >
            {isMaximized ? <CopyIcon className="size-3.5" /> : <SquareIcon className="size-3.5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{isMaximized ? '还原窗口' : '最大化'}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="关闭窗口"
            className="hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20"
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>关闭窗口</TooltipContent>
      </Tooltip>
    </div>
  )
}
