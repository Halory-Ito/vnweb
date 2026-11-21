'use client'

import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { createLayoutSyncedStorage } from '@/lib/settings/layout-settings'

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

export const sidebarHiddenAtom = atomWithStorage(
  'vnweb.layout.sidebar-hidden',
  false,
  createLayoutSyncedStorage('sidebarHidden', isBoolean),
)
export const headerHiddenAtom = atomWithStorage(
  'vnweb.layout.header-hidden',
  false,
  createLayoutSyncedStorage('headerHidden', isBoolean),
)
export const borderlessAtom = atomWithStorage(
  'vnweb.layout.borderless',
  false,
  createLayoutSyncedStorage('borderless', isBoolean),
)

export function useLayoutVisibility() {
  const [sidebarHidden, setSidebarHidden] = useAtom(sidebarHiddenAtom)
  const [headerHidden, setHeaderHidden] = useAtom(headerHiddenAtom)

  return { sidebarHidden, setSidebarHidden, headerHidden, setHeaderHidden }
}
