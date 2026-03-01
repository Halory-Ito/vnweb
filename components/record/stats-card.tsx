'use client'

import { BadgeCheckIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { Button } from '../ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'

export type StatsCardProps = {
  title: string
  icon: React.ReactNode
  value: string | number
  unit?: string
}

export const SimpleStatsCard = ({
  title,
  icon,
  value,
  unit,
}: StatsCardProps) => {
  return (
    <Card className="w-full" variant="outline">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>{icon}</CardAction>
      </CardHeader>
      <CardContent>
        <div className="space-x-1 text-2xl">
          <span>{value}</span>
          <span>{unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export type ChartStatsCardProps = {
  title: string
  description: string
  children: React.ReactNode
}

export const ChartStatsCard = ({
  title,
  description,
  children,
}: ChartStatsCardProps) => {
  return (
    <Card className="w-full" variant="outline">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export type RankItem = {
  id: string
  cover: string
  title: string
  stat: number
}

export type RankStatsCardProps = {
  title: string
  rankItems: RankItem[]
  unit: string
}

export const RankStatsCard = ({
  title,
  rankItems = [],
  unit,
}: RankStatsCardProps) => {
  return (
    <Card className="w-full" variant="outline">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rankItems.map((item, idx) => (
          <Item
            key={item.id}
            className="p-2"
            variant="default"
            size="sm"
            asChild
          >
            <Link href={`/game/${item.id}`}>
              <ItemMedia>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-800 text-lg font-bold text-white">
                  <span>{idx + 1}</span>
                </div>
              </ItemMedia>
              <ItemMedia>
                <div className="relative h-12 w-10">
                  <Image
                    className="rounded-sm object-cover"
                    alt="img"
                    src={item.cover}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="block max-w-64 truncate font-bold sm:max-w-24 md:max-w-42 lg:max-w-72 xl:max-w-96 2xl:max-w-108">
                  {item.title}
                </ItemTitle>
              </ItemContent>
              <ItemActions>
                {item.stat} {unit}
              </ItemActions>
            </Link>
          </Item>
        ))}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button onClick={() => alert('clicked')} variant="link">
          查看全部
        </Button>
      </CardFooter>
    </Card>
  )
}
