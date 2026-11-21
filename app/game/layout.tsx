import { Metadata } from 'next'

import GameLibraryLayout from '@/features/game/components/game-library-layout'

export const metadata: Metadata = {
  title: '我的游戏',
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <GameLibraryLayout>{children}</GameLibraryLayout>
}
