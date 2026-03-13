'use client'

import { useQuery } from '@tanstack/react-query'
import { DownloadIcon } from 'lucide-react'
import { useMemo, useState } from 'react'

import { fetchRecordExportApi } from '@/app/record/query-options'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const formatDurationText = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  return `${hours} 小时 ${minutes} 分钟`
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Image load failed: ${src}`))

    if (src.startsWith('http')) {
      img.src = src
    } else if (typeof window !== 'undefined') {
      img.src = `${window.location.origin}${src}`
    } else {
      img.src = src
    }
  })

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + w - radius, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
  ctx.lineTo(x + w, y + h - radius)
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  ctx.lineTo(x + radius, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export default function RecordExportPanel() {
  const isClient = typeof window !== 'undefined'
  const [isExporting, setIsExporting] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['record-export'],
    queryFn: () => fetchRecordExportApi(),
    enabled: isClient,
  })

  const entries = useMemo(() => data?.entries ?? [], [data])

  const handleExportPoster = async () => {
    if (!entries.length || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const width = 1400
      const headerHeight = 190
      const rowHeight = 136
      const rowGap = 14
      const footerHeight = 72
      const maxRows = Math.max(1, entries.length)
      const height =
        headerHeight +
        maxRows * rowHeight +
        (maxRows - 1) * rowGap +
        footerHeight

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context unavailable')
      }

      const bgGradient = ctx.createLinearGradient(0, 0, width, height)
      bgGradient.addColorStop(0, '#0f172a')
      bgGradient.addColorStop(1, '#1d4ed8')
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 56px sans-serif'
      ctx.fillText('VNWeb 游戏年度海报', 64, 86)

      ctx.font = '28px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.92)'
      ctx.fillText(
        `总游戏时长：${Number(data?.totalPlayHours || 0).toFixed(2)} 小时`,
        64,
        132,
      )

      ctx.font = '20px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.82)'
      ctx.fillText('占比按每个游戏累计时长计算，展示封面与核心标签', 64, 166)

      const imageCache = new Map<string, HTMLImageElement>()
      for (const entry of entries) {
        try {
          if (!imageCache.has(entry.cover)) {
            const img = await loadImage(entry.cover)
            imageCache.set(entry.cover, img)
          }
        } catch {
          // Ignore image loading failures and fallback to placeholder block.
        }
      }

      let y = headerHeight
      for (const [index, entry] of entries.entries()) {
        const x = 58
        const cardW = width - 116
        const cardH = rowHeight

        ctx.fillStyle = 'rgba(255,255,255,0.14)'
        drawRoundedRect(ctx, x, y, cardW, cardH, 22)
        ctx.fill()

        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1
        drawRoundedRect(ctx, x, y, cardW, cardH, 22)
        ctx.stroke()

        const coverX = x + 18
        const coverY = y + 14
        const coverW = 82
        const coverH = cardH - 28

        const image = imageCache.get(entry.cover)
        if (image) {
          ctx.save()
          drawRoundedRect(ctx, coverX, coverY, coverW, coverH, 10)
          ctx.clip()
          ctx.drawImage(image, coverX, coverY, coverW, coverH)
          ctx.restore()
        } else {
          ctx.fillStyle = 'rgba(15,23,42,0.75)'
          drawRoundedRect(ctx, coverX, coverY, coverW, coverH, 10)
          ctx.fill()
        }

        const textX = coverX + coverW + 20
        const title = `${index + 1}. ${entry.title}`

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px sans-serif'
        ctx.fillText(title, textX, y + 42)

        const tagsText =
          entry.tags.length > 0
            ? `核心标签: ${entry.tags.join(' / ')}`
            : '核心标签: 未设置'
        ctx.fillStyle = 'rgba(255,255,255,0.88)'
        ctx.font = '20px sans-serif'
        ctx.fillText(tagsText, textX, y + 72)

        const ratioBarX = textX
        const ratioBarY = y + 88
        const ratioBarW = 520
        const ratioBarH = 18

        ctx.fillStyle = 'rgba(255,255,255,0.22)'
        drawRoundedRect(ctx, ratioBarX, ratioBarY, ratioBarW, ratioBarH, 9)
        ctx.fill()

        ctx.fillStyle = '#38bdf8'
        drawRoundedRect(
          ctx,
          ratioBarX,
          ratioBarY,
          Math.max(8, (ratioBarW * entry.ratio) / 100),
          ratioBarH,
          9,
        )
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 22px sans-serif'
        ctx.fillText(
          `${entry.ratio.toFixed(2)}%`,
          ratioBarX + ratioBarW + 20,
          y + 104,
        )

        ctx.font = '20px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fillText(
          `${entry.totalPlayHours.toFixed(2)}h (${formatDurationText(entry.totalPlaySeconds)})`,
          ratioBarX + ratioBarW + 140,
          y + 104,
        )

        y += rowHeight + rowGap
      }

      const link = document.createElement('a')
      link.download = `record-poster-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Export poster failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card variant="outline">
        <CardHeader>
          <CardTitle>导出游戏时长占比海报</CardTitle>
          <CardDescription>
            基于每个游戏的累计时长占比，组合生成海报。每个卡片包含游戏封面与核心标签。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            {isLoading
              ? '正在加载导出数据...'
              : `已统计 ${entries.length} 个游戏，累计 ${Number(data?.totalPlayHours || 0).toFixed(2)} 小时`}
          </div>

          <Button
            type="button"
            onClick={handleExportPoster}
            disabled={isLoading || isExporting || entries.length === 0}
          >
            <DownloadIcon className="size-4" />
            {isExporting ? '生成中...' : '生成并下载海报'}
          </Button>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <div className="truncate pr-4">
                  <div className="truncate font-medium">{entry.title}</div>
                  <div className="text-muted-foreground truncate">
                    {entry.tags.join(' / ') || '无标签'}
                  </div>
                </div>
                <div className="font-semibold">{entry.ratio.toFixed(2)}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
