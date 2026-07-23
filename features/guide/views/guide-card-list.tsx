'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen } from 'lucide-react'
import { motion } from 'motion/react'
import { useRouter } from 'next/navigation'

import GuideCard from '@/features/guide/components/guide-card'
import { getGuideListApi } from '@/features/guide/guide-api'
import { fastContainerVariants, cardVariants } from '@/features/guide/data/motion'

export default function GuideCardList() {
  const router = useRouter()
  const { data: guides, isLoading } = useQuery({
    queryKey: ['guide-list'],
    queryFn: () => getGuideListApi(),
  })

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!guides || guides.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3">
        <BookOpen className="text-muted-foreground h-10 w-10" />
        <p className="text-muted-foreground text-sm">暂无攻略数据</p>
        <p className="text-muted-foreground text-xs">请先导入攻略</p>
      </div>
    )
  }

  return (
    <motion.div
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8"
      variants={fastContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {guides.map((guide) => (
        <motion.div key={guide.id} variants={cardVariants}>
          <GuideCard
            guide={guide}
            onClick={() => router.push(`/guide/${guide.gameId}`)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
