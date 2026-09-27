import { Metadata } from 'next'

import { RecentHome } from '@/features/recent'

export const metadata: Metadata = {
  title: '主页',
  description: '最近访问',
}

export default function Page() {
  return <RecentHome />
}
