'use client'

import { useQuery } from '@tanstack/react-query'
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
} from 'lucide-react'
import { useRef, useState } from 'react'

import GameCard from './game-card'
import { SortSelect } from './sort-select'
import { Button } from '@/components/ui/button'
import { getCollections, getGameCardList } from '@/lib/game-utils'

export default function GameHome() {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-12 overflow-x-hidden overflow-y-scroll p-4">
      <RecentGame />
      <MyColletion />
      <AllGame />
    </div>
  )
}

const RecentGame = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
  })

  const scrollCards = (direction: 'left' | 'right') => {
    const offset = 320
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    })
  }

  const items: GameCardProps[] = gameCards
    .filter((item) => item.lastRunAt)
    .sort(
      (a, b) =>
        new Date(b.lastRunAt).getTime() - new Date(a.lastRunAt).getTime(),
    )
    .slice(0, 20)
  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-bold">最近游戏</div>
        <div className="space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('left')}
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('right')}
          >
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="no-scrollbar flex space-x-4 overflow-x-auto"
      >
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            <GameCard {...item} />
          </div>
        ))}
      </div>
    </div>
  )
}

const MyColletion = () => {
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: collections = [] } = useQuery({
    queryKey: ['collections'],
    queryFn: getCollections,
  })

  const scrollCards = (direction: 'left' | 'right') => {
    const offset = 320
    scrollRef.current?.scrollBy({
      left: direction === 'left' ? -offset : offset,
      behavior: 'smooth',
    })
  }

  const items: GameCardProps[] = collections
    .filter((collection) => collection.games.length > 0)
    .map((collection) => {
      const firstGame = collection.games[0]
      return {
        id: `collection-${collection.id}`,
        href: `/game/collection/${collection.id}`,
        title: collection.name,
        cover: collection.firstGameCover || firstGame.cover || '/cover/wa2.jpg',
        playTime: 0,
        publishAt: '',
        lastRunAt: '',
        addedAt: '',
        rating: 0,
      }
    })
  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xl font-bold">我的收藏</div>
        <div className="space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('left')}
          >
            <ArrowLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollCards('right')}
          >
            <ArrowRightIcon />
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="no-scrollbar flex space-x-4 overflow-x-auto"
      >
        {items.map((item) => (
          <div key={item.id} className="shrink-0">
            <GameCard {...item} />
          </div>
        ))}
      </div>
    </div>
  )
}

const AllGame = () => {
  const [order, setOrder] = useState<string>('asc')
  const [orderBy, setOrderBy] = useState<string>('add_date')
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: getGameCardList,
  })

  const items: GameCardProps[] = [...gameCards]

  items.sort((a, b) => {
    let compare = 0
    switch (orderBy) {
      case 'name':
        compare = a.title.localeCompare(b.title)
        break
      case 'public_date':
        compare =
          new Date(a.publishAt).getTime() - new Date(b.publishAt).getTime()
        break
      case 'last_run':
        compare =
          new Date(a.lastRunAt).getTime() - new Date(b.lastRunAt).getTime()
        break
      case 'add_date':
        compare = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime()
        break
      case 'play_time':
        compare = a.playTime - b.playTime
        break
      case 'rating':
        compare = a.rating - b.rating
        break
    }
    return order === 'asc' ? compare : -compare
  })
  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center space-x-4">
        <div className="text-xl font-bold">所有游戏</div>
        <div className="text-xl font-bold">排序依据:</div>
        <SortSelect orderBy={orderBy} setOrderBy={setOrderBy} />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
        >
          {order === 'asc' ? <ArrowDownIcon /> : <ArrowUpIcon />}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <GameCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}
