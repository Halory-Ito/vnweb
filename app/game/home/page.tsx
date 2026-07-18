import { Metadata } from 'next'

import GameHome from '@/components/home/game-home'

export const metadata: Metadata = {
  title: '游戏库',
  description: '游戏主页',
}

export default function Home() {
  return <GameHome />
}
