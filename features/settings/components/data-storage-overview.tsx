import { Cell, Label, Pie, PieChart } from 'recharts'

import { formatResourceSize } from '../lib/data-resource-utils'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

import type { ResourceChartDatum } from '../hooks/use-data-settings'
import type { ResourceCategory } from '../settings-api'

export const PIE_COLORS: Record<ResourceCategory, string> = {
  image: 'var(--chart-1)',
  video: 'var(--chart-2)',
  audio: 'var(--chart-3)',
  font: 'var(--chart-4)',
}

const pieChartConfig = {
  size: { label: '占用空间' },
  image: { label: '图片', color: PIE_COLORS.image },
  video: { label: '视频', color: PIE_COLORS.video },
  audio: { label: '音频', color: PIE_COLORS.audio },
  font: { label: '字体', color: PIE_COLORS.font },
} satisfies ChartConfig

export function DataStorageOverview({
  pieData,
  totalSize,
  totalCount,
  imageUsageOpen,
  onToggleImageUsage,
}: {
  pieData: ResourceChartDatum[]
  totalSize: number
  totalCount: number
  imageUsageOpen: boolean
  onToggleImageUsage: () => void
}) {
  const totalSizeLabel = formatResourceSize(totalSize)
  return (
    <ChartContainer config={pieChartConfig} className="mx-auto h-56 w-full max-w-xs">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(_value, _name, item) => {
                const payload = item.payload as ResourceChartDatum
                return `${payload.label}：${formatResourceSize(payload.size)}（${payload.percent}%）`
              }}
            />
          }
        />
        <Pie
          data={pieData}
          dataKey="size"
          nameKey="label"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={2}
          strokeWidth={2}
          isAnimationActive={false}
          onClick={(_, index) => {
            if (pieData[index]?.category === 'image') onToggleImageUsage()
          }}
          onKeyDown={(_, index, event) => {
            if (
              pieData[index]?.category === 'image' &&
              (event.key === 'Enter' || event.key === ' ')
            ) {
              event.preventDefault()
              onToggleImageUsage()
            }
          }}
        >
          {pieData.map((entry) => (
            <Cell
              key={entry.category}
              fill={PIE_COLORS[entry.category]}
              className={entry.category === 'image' ? 'cursor-pointer' : undefined}
              aria-label={
                entry.category === 'image'
                  ? imageUsageOpen
                    ? '收起图片组成'
                    : '展开图片组成'
                  : entry.label
              }
            />
          ))}
          <Label
            content={({ viewBox }) => {
              if (!viewBox || !('cx' in viewBox) || !('cy' in viewBox)) return null
              return (
                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                  <tspan
                    x={viewBox.cx}
                    y={viewBox.cy}
                    className="fill-foreground text-base font-semibold"
                  >
                    {totalSizeLabel}
                  </tspan>
                  <tspan
                    x={viewBox.cx}
                    y={(viewBox.cy || 0) + 18}
                    className="fill-muted-foreground text-xs"
                  >
                    {totalCount} 个文件
                  </tspan>
                </text>
              )
            }}
          />
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
