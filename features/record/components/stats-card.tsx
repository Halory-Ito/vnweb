'use client'

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export type StatsCardProps = {
  title: string
  icon: React.ReactNode
  value: string | number
  unit?: string
}

export const SimpleStatsCard = ({ title, icon, value, unit }: StatsCardProps) => {
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
