'use client'

import { atom, useAtom, type PrimitiveAtom } from 'jotai'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useIsMobile } from './use-mobile'

type DropdownMode = 'mobile' | 'desktop' | 'all'

export const mobileNavOpenAtom = atom(false)

function useCloseOnRouteOrViewportChange(setOpen: (open: boolean) => void, mode: DropdownMode) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const visible = mode === 'all' || (mode === 'mobile' ? isMobile : !isMobile)

  useEffect(() => {
    setOpen(false)
  }, [isMobile, pathname, setOpen])

  return visible
}

export function useHeaderDropdownMenu(mode: DropdownMode = 'all') {
  const [open, setOpen] = useState(false)
  const visible = useCloseOnRouteOrViewportChange(setOpen, mode)

  return { open: open && visible, setOpen }
}

export function useSharedHeaderDropdownMenu(
  openAtom: PrimitiveAtom<boolean>,
  mode: DropdownMode = 'all',
) {
  const [open, setOpen] = useAtom(openAtom)
  const visible = useCloseOnRouteOrViewportChange(setOpen, mode)

  return { open: open && visible, setOpen }
}
