import ThemeContent from './theme-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '主题设置',
}

export default function ThemePage() {
  return <ThemeContent />
}
