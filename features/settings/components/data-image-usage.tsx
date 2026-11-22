import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import { formatResourceSize } from '../lib/data-resource-utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import {
  IMAGE_USAGE_LABELS,
  type ImageUsage,
  type LocalResourceSummary,
} from '@/types/local-resource'

const config = {
  size: { label: '占用空间', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function DataImageUsage({ summary }: { summary: LocalResourceSummary }) {
  const rows = Object.entries(summary.imagesByUsage ?? {})
    .map(([usage, stats]) => ({ ...stats, label: IMAGE_USAGE_LABELS[usage as ImageUsage] }))
    .sort((a, b) => b.size - a.size)
  const total = summary.categories.image.size

  return (
    <section
      aria-label="图片组成"
      className="min-w-0 space-y-2 border-t pt-3 @min-[36rem]:border-t-0 @min-[36rem]:border-l @min-[36rem]:pt-0 @min-[36rem]:pl-4"
    >
      <h3 className="text-sm font-medium">图片组成</h3>
      {rows.length ? (
        <ChartContainer config={config} className="aspect-auto h-56 w-full">
          <BarChart accessibilityLayer data={rows} layout="vertical" margin={{ right: 12 }}>
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatResourceSize}
              axisLine={false}
              tickLine={false}
              tickCount={4}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={68}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(_value, _name, item) => {
                    const { count, size } = item.payload as (typeof rows)[number]
                    const percent = total ? Math.round((size / total) * 1000) / 10 : 0
                    return `${formatResourceSize(size)} · ${count} 张 · ${percent}%`
                  }}
                />
              }
            />
            <Bar
              dataKey="size"
              fill="var(--color-size)"
              radius={[0, 4, 4, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
          </BarChart>
        </ChartContainer>
      ) : (
        <p className="text-muted-foreground py-4 text-sm">暂无图片用途数据</p>
      )}
    </section>
  )
}
