'use client'

import { useAtom } from 'jotai'
import { useTheme } from 'next-themes'

import { useHeaderDropdownMenu } from './use-header-dropdown-menu'
import { showNsfwAtom } from '@/atom/global'

export function useMobileHeaderMenu() {
  const menu = useHeaderDropdownMenu('mobile')
  const [showNsfw, setShowNsfw] = useAtom(showNsfwAtom)
  const { resolvedTheme, setTheme } = useTheme()

  return {
    ...menu,
    showNsfw,
    setShowNsfw,
    isDark: resolvedTheme === 'dark',
    toggleTheme: () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark'),
  }
}
