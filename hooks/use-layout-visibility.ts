'use client'

import { useAtom } from 'jotai'
import { atomWithStorage, unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

const booleanStorage = unstable_withStorageValidator(
  (value): value is boolean => typeof value === 'boolean',
)(createJSONStorage(() => window.localStorage))

const sidebarHiddenAtom = atomWithStorage('vnweb.layout.sidebar-hidden', false, booleanStorage)
const headerHiddenAtom = atomWithStorage('vnweb.layout.header-hidden', false, booleanStorage)

export function useLayoutVisibility() {
  const [sidebarHidden, setSidebarHidden] = useAtom(sidebarHiddenAtom)
  const [headerHidden, setHeaderHidden] = useAtom(headerHiddenAtom)

  return { sidebarHidden, setSidebarHidden, headerHidden, setHeaderHidden }
}
