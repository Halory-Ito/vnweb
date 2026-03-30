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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

const formatDurationText = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(Number(seconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  return `${hours} 小时 ${minutes} 分钟`
}

const formatHoursText = (seconds: number) => {
  const hours = seconds / 3600
  if (hours < 1) {
    return `${Math.round(seconds / 60)} 分钟`
  }
  return `${hours.toFixed(2)} 小时`
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

const backgroundPresets = [
  { name: '深蓝渐变', colors: ['#0f172a', '#1d4ed8'] },
  { name: '紫色渐变', colors: ['#1e1b4b', '#7c3aed'] },
  { name: '绿色渐变', colors: ['#052e16', '#15803d'] },
  { name: '橙色渐变', colors: ['#431407', '#c2410c'] },
  { name: '粉色渐变', colors: ['#4a051c', '#db2777'] },
  { name: '青色渐变', colors: ['#083344', '#0891b2'] },
  { name: '自定义', colors: null },
]

type LayoutOption = 'list' | 'compact'

interface ExportOptions {
  showCover: boolean
  showTags: boolean
  showGameInfo: boolean
}

export default function RecordExportPanel() {
  const isClient = typeof window !== 'undefined'
  const [isExporting, setIsExporting] = useState(false)
  const [gameCount, setGameCount] = useState([10])
  const [layout, setLayout] = useState<LayoutOption>('list')
  const [selectedBgIndex, setSelectedBgIndex] = useState(0)
  const [customBgColor, setCustomBgColor] = useState('#1e40af')
  const [options, setOptions] = useState<ExportOptions>({
    showCover: true,
    showTags: true,
    showGameInfo: false,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['record-export'],
    queryFn: () => fetchRecordExportApi(),
    enabled: isClient,
  })

  const entries = useMemo(() => data?.entries ?? [], [data])
  const displayEntries = useMemo(
    () => entries.slice(0, gameCount[0]),
    [entries, gameCount],
  )

  const getBgColors = () => {
    if (selectedBgIndex === backgroundPresets.length - 1) {
      // 自定义颜色
      return [customBgColor, adjustColor(customBgColor, 40)]
    }
    return backgroundPresets[selectedBgIndex].colors || ['#0f172a', '#1d4ed8']
  }

  const adjustColor = (hex: string, amount: number) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const handleExportPoster = async () => {
    if (!displayEntries.length || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const bgColors = getBgColors()
      const width = layout === 'list' ? 1400 : 1200
      const headerHeight = 190
      const rowHeight =
        layout === 'list' ? (options.showGameInfo ? 160 : 136) : 160
      const rowGap = 14
      const footerHeight = 72
      const cols = layout === 'compact' ? 2 : 1
      const rows = Math.ceil(displayEntries.length / cols)
      const height =
        headerHeight + rows * rowHeight + (rows - 1) * rowGap + footerHeight

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context unavailable')
      }

      const bgGradient = ctx.createLinearGradient(0, 0, width, height)
      bgGradient.addColorStop(0, bgColors[0])
      bgGradient.addColorStop(1, bgColors[1])
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
      const layoutText = layout === 'list' ? '列表' : '紧凑'
      ctx.fillText(
        `展示前 ${displayEntries.length} 个游戏 | 布局: ${layoutText}`,
        64,
        166,
      )

      const imageCache = new Map<string, HTMLImageElement>()
      for (const entry of displayEntries) {
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
      for (const [index, entry] of displayEntries.entries()) {
        const col = layout === 'compact' ? index % cols : 0
        const x = layout === 'compact' ? (col === 0 ? 58 : width / 2 + 20) : 58
        const cardW = layout === 'compact' ? (width - 116) / 2 : width - 116
        const cardH = rowHeight

        ctx.fillStyle = 'rgba(255,255,255,0.14)'
        drawRoundedRect(ctx, x, y, cardW, cardH, 22)
        ctx.fill()

        ctx.strokeStyle = 'rgba(255,255,255,0.25)'
        ctx.lineWidth = 1
        drawRoundedRect(ctx, x, y, cardW, cardH, 22)
        ctx.stroke()

        let textX = x + 18

        // 游戏封面
        if (options.showCover) {
          const coverX = x + 18
          const coverY = y + 14
          const coverW = layout === 'compact' ? 70 : 82
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
          textX = coverX + coverW + 20
        }

        // 标题
        const title = `${index + 1}. ${entry.title}`
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 28px sans-serif'
        ctx.fillText(title, textX, y + 42)

        // 游戏信息
        let infoY = y + 72
        if (options.showGameInfo) {
          const infoParts: string[] = []
          if (entry.releaseDate) {
            infoParts.push(`发行: ${entry.releaseDate}`)
          }
          if (entry.platforms && entry.platforms.length > 0) {
            infoParts.push(`平台: ${entry.platforms.slice(0, 2).join(', ')}`)
          }
          if (entry.developer) {
            infoParts.push(`开发: ${entry.developer}`)
          }
          if (infoParts.length > 0) {
            ctx.fillStyle = 'rgba(255,255,255,0.7)'
            ctx.font = '18px sans-serif'
            ctx.fillText(infoParts.join(' | '), textX, infoY)
            infoY += 28
          }
        }

        // 标签
        if (options.showTags && entry.tags.length > 0) {
          const tagsText = `核心标签: ${entry.tags.join(' / ')}`
          ctx.fillStyle = 'rgba(255,255,255,0.88)'
          ctx.font = '20px sans-serif'
          ctx.fillText(tagsText, textX, infoY)
        }

        // 进度条
        const ratioBarX = textX
        const ratioBarY =
          y + (options.showGameInfo || options.showTags ? 120 : 88)
        const ratioBarW = layout === 'compact' ? 280 : 520
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
          y + (options.showGameInfo || options.showTags ? 132 : 104),
        )

        ctx.font = '20px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
        ctx.fillText(
          `${entry.totalPlayHours.toFixed(2)}h (${formatDurationText(entry.totalPlaySeconds)})`,
          ratioBarX + ratioBarW + 140,
          y + (options.showGameInfo || options.showTags ? 132 : 104),
        )

        if (layout === 'compact' && col === 1) {
          y += rowHeight + rowGap
        } else if (layout === 'list') {
          y += rowHeight + rowGap
        }
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

  const handleExportSingleGame = async (entry: (typeof entries)[0]) => {
    if (isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const bgColors = getBgColors()
      const width = 1200
      const height = 950

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Canvas context unavailable')
      }

      const bgGradient = ctx.createLinearGradient(0, 0, width, height)
      bgGradient.addColorStop(0, bgColors[0])
      bgGradient.addColorStop(1, bgColors[1])
      ctx.fillStyle = bgGradient
      ctx.fillRect(0, 0, width, height)

      // 游戏封面
      if (options.showCover) {
        const image = await loadImage(entry.cover).catch(() => null)
        if (image) {
          ctx.save()
          drawRoundedRect(ctx, 50, 50, 280, 400, 20)
          ctx.clip()
          ctx.drawImage(image, 50, 50, 280, 400)
          ctx.restore()
        } else {
          ctx.fillStyle = 'rgba(15,23,42,0.75)'
          drawRoundedRect(ctx, 50, 50, 280, 400, 20)
          ctx.fill()
        }
      }

      // 游戏标题
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 48px sans-serif'
      ctx.fillText(entry.title, options.showCover ? 360 : 50, 100)

      // 统计信息卡片背景
      const cardX = options.showCover ? 360 : 50
      const cardY = 130
      const cardW = options.showCover ? 780 : 1100
      const cardH = 280
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 15)
      ctx.fill()

      // 游玩日期
      ctx.font = '26px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText('游玩日期', cardX + 30, cardY + 45)
      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#ffffff'
      const firstDate = entry.firstPlayAt || '未知'
      const lastDate = entry.lastPlayAt || '未知'
      ctx.fillText(
        `首次: ${firstDate}  |  最后: ${lastDate}`,
        cardX + 30,
        cardY + 85,
      )

      // 时长统计
      ctx.font = '26px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText('时长统计', cardX + 30, cardY + 140)
      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(
        `总时长: ${entry.totalPlayHours.toFixed(2)} 小时`,
        cardX + 30,
        cardY + 180,
      )
      ctx.fillText(
        `日均: ${formatHoursText(entry.avgDailySeconds)}`,
        cardX + 30,
        cardY + 215,
      )
      ctx.fillText(
        `日最常: ${formatHoursText(entry.maxDailySeconds)}`,
        cardX + 400,
        cardY + 180,
      )
      ctx.fillText(`占比: ${entry.ratio.toFixed(2)}%`, cardX + 400, cardY + 215)

      // 游戏评价
      ctx.font = '26px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillText('游戏评价', cardX + 30, cardY + 270)
      ctx.font = '24px sans-serif'
      ctx.fillStyle = '#ffffff'
      if (entry.rating !== null && entry.rating > 0) {
        const ratingDisplay = (entry.rating / 2).toFixed(1)
        ctx.fillText(`${ratingDisplay} / 5`, cardX + 30, cardY + 305)
        // 星级显示
        const fullStars = Math.floor(entry.rating / 2)
        const halfStar = entry.rating % 2 >= 1
        let starStr =
          '★'.repeat(fullStars) +
          (halfStar ? '☆' : '') +
          '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0))
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(starStr, cardX + 120, cardY + 305)
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText('暂无评价', cardX + 30, cardY + 305)
      }

      // 游戏信息（发行日期、平台、开发商）
      if (options.showGameInfo) {
        const infoY = 460
        ctx.font = '24px sans-serif'
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        if (entry.releaseDate) {
          ctx.fillText(`发行日期: ${entry.releaseDate}`, 50, infoY)
        }
        if (entry.platforms && entry.platforms.length > 0) {
          ctx.fillText(`平台: ${entry.platforms.join(', ')}`, 50, infoY + 35)
        }
        if (entry.developer) {
          ctx.fillText(`开发商: ${entry.developer}`, 50, infoY + 70)
        }
        if (entry.publisher) {
          ctx.fillText(`发行商: ${entry.publisher}`, 50, infoY + 105)
        }
      }

      // 进度条
      const barX = 50
      const barY = options.showGameInfo ? 620 : 460
      const barW = width - 100
      const barH = 40

      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      drawRoundedRect(ctx, barX, barY, barW, barH, 20)
      ctx.fill()

      ctx.fillStyle = '#38bdf8'
      drawRoundedRect(
        ctx,
        barX,
        barY,
        Math.max(20, (barW * entry.ratio) / 100),
        barH,
        20,
      )
      ctx.fill()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 24px sans-serif'
      ctx.fillText(`时长占比 ${entry.ratio.toFixed(2)}%`, barX + 30, barY + 28)

      // 标签
      if (options.showTags && entry.tags.length > 0) {
        ctx.fillStyle = '#ffffff'
        ctx.font = '28px sans-serif'
        ctx.fillText(`标签: ${entry.tags.join(' / ')}`, 50, barY + 80)
      }

      // 日期
      ctx.font = '22px sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(
        `导出日期: ${new Date().toLocaleDateString('zh-CN')}`,
        50,
        height - 40,
      )

      const link = document.createElement('a')
      link.download = `game-report-${entry.id}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Export single game failed:', error)
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
            自定义海报样式，支持多种布局和背景颜色选择。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 背景颜色选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">背景颜色</label>
              <div className="flex flex-wrap gap-2">
                {backgroundPresets.map((preset, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedBgIndex(index)}
                    className={`h-8 w-8 rounded-full transition-all ${
                      selectedBgIndex === index
                        ? 'scale-110 border border-white'
                        : 'border-transparent'
                    }`}
                    style={
                      preset.colors
                        ? {
                            background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                          }
                        : {
                            background: customBgColor,
                          }
                    }
                    title={preset.name}
                  />
                ))}
              </div>
              {selectedBgIndex === backgroundPresets.length - 1 && (
                <input
                  type="color"
                  value={customBgColor}
                  onChange={(e) => setCustomBgColor(e.target.value)}
                  className="h-8 w-full cursor-pointer rounded border"
                />
              )}
            </div>

            {/* 布局选择 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">布局</label>
              <Select
                value={layout}
                onValueChange={(v) => setLayout(v as LayoutOption)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">列表布局</SelectItem>
                  <SelectItem value="compact">紧凑布局 (2列)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 显示选项 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">显示内容</label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showCover"
                  checked={options.showCover}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, showCover: checked === true })
                  }
                />
                <label
                  htmlFor="showCover"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  显示游戏封面
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showTags"
                  checked={options.showTags}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, showTags: checked === true })
                  }
                />
                <label
                  htmlFor="showTags"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  显示游戏标签
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showGameInfo"
                  checked={options.showGameInfo}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, showGameInfo: checked === true })
                  }
                />
                <label
                  htmlFor="showGameInfo"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  显示发行日期、平台、开发商
                </label>
              </div>
            </div>
          </div>

          {/* 游戏数量 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              游戏数量: {gameCount[0]}
            </label>
            <Slider
              min={1}
              max={Math.max(20, entries.length)}
              step={1}
              value={gameCount}
              onValueChange={setGameCount}
            />
          </div>

          {/* 导出按钮 */}
          <Button
            type="button"
            onClick={handleExportPoster}
            disabled={isLoading || isExporting || entries.length === 0}
          >
            <DownloadIcon className="size-4" />
            {isExporting ? '生成中...' : '生成并下载海报'}
          </Button>

          {/* 游戏列表 */}
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {displayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="truncate font-medium">{entry.title}</div>
                  <div className="text-muted-foreground flex items-center gap-2 truncate text-xs">
                    <span>{entry.tags.join(' / ') || '无标签'}</span>
                    <span className="font-semibold">
                      {entry.ratio.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void handleExportSingleGame(entry)}
                  disabled={isExporting}
                >
                  导出
                </Button>
              </div>
            ))}
          </div>

          {entries.length > gameCount[0] && (
            <p className="text-muted-foreground text-xs">
              还有 {entries.length - gameCount[0]}{' '}
              个游戏未显示，请调整游戏数量滑块
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
