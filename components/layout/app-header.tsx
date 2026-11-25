'use client'

import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react'
import { useSelectedLayoutSegment, useRouter } from 'next/navigation'

import MobileHeaderMenu from './mobile-header-menu'
import R18Switch from './r18-switch'
import ThemeSwitch from './theme-switch'
import { Button } from '@/components/ui/button'
import { AgentDrawerTrigger } from '@/features/agent'
import GameHeaderControls from '@/features/game/components/game-header-controls'
import GameAddButton from '@/features/game/components/import/game-add-button'

import type { ReactNode } from 'react'

export function AppHeaderActions({
  mobileNav,
  onOpenAgent,
  windowControls,
}: {
  mobileNav: ReactNode
  onOpenAgent: () => void
  windowControls?: ReactNode
}) {
  const section = useSelectedLayoutSegment()
  const router = useRouter()

  return (
    <>
      <div className="flex items-center gap-2 md:gap-4">
        <div className="md:hidden">{mobileNav}</div>
        <div className="hidden items-center gap-4 md:flex">
          <Button onClick={router.back} variant="outline" size="icon" aria-label="返回">
            <ArrowLeftIcon />
          </Button>
          <Button onClick={router.forward} variant="outline" size="icon" aria-label="前进">
            <ArrowRightIcon />
          </Button>
          <GameAddButton desktopOnly />
        </div>
      </div>

      {section === 'game' ? (
        <div className="order-last w-full min-w-0 md:order-none md:w-auto md:flex-1">
          <GameHeaderControls />
        </div>
      ) : null}

      <div className="ml-auto flex items-center gap-2 md:gap-4">
        <div className="hidden items-center gap-4 md:flex">
          <R18Switch />
          <ThemeSwitch />
        </div>
        <AgentDrawerTrigger onClick={onOpenAgent} />
        <MobileHeaderMenu />
        {windowControls}
      </div>
    </>
  )
}
