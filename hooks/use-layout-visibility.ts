'use client'

import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { createLayoutSyncedStorage, DEFAULT_LAYOUT_SETTINGS } from '@/lib/settings/layout-settings'

const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean'

export const sidebarHiddenAtom = atomWithStorage(
  'vnweb.layout.sidebar-hidden',
  DEFAULT_LAYOUT_SETTINGS.sidebarHidden,
  createLayoutSyncedStorage('sidebarHidden', isBoolean),
)
export const headerHiddenAtom = atomWithStorage(
  'vnweb.layout.header-hidden',
  DEFAULT_LAYOUT_SETTINGS.headerHidden,
  createLayoutSyncedStorage('headerHidden', isBoolean),
)
export const borderlessAtom = atomWithStorage(
  'vnweb.layout.borderless',
  DEFAULT_LAYOUT_SETTINGS.borderless,
  createLayoutSyncedStorage('borderless', isBoolean),
)
export const NATIVE_TITLE_BAR_STORAGE_KEY = 'vnweb.layout.native-title-bar'

export const nativeTitleBarAtom = atomWithStorage(
  NATIVE_TITLE_BAR_STORAGE_KEY,
  DEFAULT_LAYOUT_SETTINGS.nativeTitleBar,
  createLayoutSyncedStorage('nativeTitleBar', isBoolean, { immediate: true }),
)

export function hasStoredNativeTitleBar(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const raw = window.localStorage.getItem(NATIVE_TITLE_BAR_STORAGE_KEY)
    if (!raw) return false
    return typeof JSON.parse(raw) === 'boolean'
  } catch {
    return false
  }
}

export function useLayoutVisibility() {
  const [sidebarHidden, setSidebarHidden] = useAtom(sidebarHiddenAtom)
  const [headerHidden, setHeaderHidden] = useAtom(headerHiddenAtom)

  return { sidebarHidden, setSidebarHidden, headerHidden, setHeaderHidden }
}
