import { SimpleStatsCard, type StatsCardProps } from '@/features/record'

type StatStripProps = {
  items: StatsCardProps[]
}

export default function StatStrip({ items }: StatStripProps) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {items.map((item) => (
        <SimpleStatsCard key={item.title} {...item} />
      ))}
    </div>
  )
}
