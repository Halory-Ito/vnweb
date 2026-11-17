'use client'

import { LayoutGroup } from 'motion/react'

import type { ReactNode } from 'react'

export default function OstLayout({ children }: { children: ReactNode }) {
  return <LayoutGroup id="ost-shared-layout">{children}</LayoutGroup>
}
