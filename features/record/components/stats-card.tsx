'use client'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export type StatsCardProps = {
  title: string
  icon: React.ReactNode
  value: string | number
  unit?: string
  compactOnMobile?: boolean
}

export const SimpleStatsCard = ({
  title,
  icon,
  value,
  unit,
  compactOnMobile = false,
}: StatsCardProps) => {
  return (
    <Card
      className={cn('w-full', compactOnMobile && 'min-w-0 gap-3 py-4 lg:gap-6 lg:py-6')}
      variant="outline"
    >
      <CardHeader className={cn(compactOnMobile && 'gap-1 px-3 lg:gap-2 lg:px-6')}>
        <CardTitle
          className={cn(
            compactOnMobile &&
              'text-xs leading-4 sm:text-sm sm:leading-5 lg:text-base lg:leading-none',
          )}
        >
          {title}
        </CardTitle>
        <CardAction>{icon}</CardAction>
      </CardHeader>
      <CardContent className={cn(compactOnMobile && 'px-3 lg:px-6')}>
        <div
          className={cn('space-x-1 text-2xl', compactOnMobile && 'text-lg sm:text-xl lg:text-2xl')}
        >
          <span>{value}</span>
          <span className={cn(compactOnMobile && 'text-xs sm:text-sm lg:text-2xl')}>{unit}</span>
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

export const ChartStatsCard = ({ title, description, children }: ChartStatsCardProps) => {
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
