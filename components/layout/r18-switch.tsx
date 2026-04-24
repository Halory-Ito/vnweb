'use client'

import { useAtom } from 'jotai'
import { EyeIcon, EyeOffIcon } from 'lucide-react'

import { showNsfwAtom } from '@/atom/global'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export default function R18Switch() {
  const [showNsfw, setShowNsfw] = useAtom(showNsfwAtom)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowNsfw((prev) => !prev)}
          aria-label={showNsfw ? '隐藏 NSFW 游戏' : '显示 NSFW 游戏'}
        >
          {showNsfw ? <EyeIcon /> : <EyeOffIcon />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {showNsfw ? '点击隐藏 NSFW 游戏' : '点击显示 NSFW 游戏'}
      </TooltipContent>
    </Tooltip>
  )
}
