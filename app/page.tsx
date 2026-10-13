import { Metadata } from 'next'

import { DashboardHome } from '@/features/dashboard'

export const metadata: Metadata = {
  title: '主页',
  description: '游戏数据总览与最近访问',
}

export default function Page() {
  return <DashboardHome />
}
