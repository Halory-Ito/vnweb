'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useIsMobile } from './use-mobile'

export function useHeaderDropdownMenu(mode: 'mobile' | 'desktop' | 'all' = 'all') {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const visible = mode === 'all' || (mode === 'mobile' ? isMobile : !isMobile)

  useEffect(() => {
    setOpen(false)
  }, [isMobile, pathname])

  return { open: open && visible, setOpen }
}
