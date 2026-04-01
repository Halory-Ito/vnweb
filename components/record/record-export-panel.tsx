'use client'

import { useQuery } from '@tanstack/react-query'
import html2canvas from 'html2canvas'
import { DownloadIcon, RotateCcwIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { TEMPLATES, type TemplateProps } from './templates'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { api } from '@/lib/request-utils'

// 模板元数据
const TEMPLATE_META = [
  { id: 'classic', name: '经典风格', description: '简洁大方的经典布局' },
  { id: 'modern', name: '现代风格', description: '渐变背景，时尚感强' },
  { id: 'minimal', name: '极简风格', description: '以内容为主，极简设计' },
  { id: 'gaming', name: '游戏风格', description: '适合游戏玩家的炫酷风格' },
] as const

// 可导出的游戏信息选项
const GAME_INFO_OPTIONS = [
  { id: 'playtime', label: '游戏时长', key: '游戏时长' },
  { id: 'rating', label: '游戏评分', key: '游戏评分' },
  { id: 'lastPlayed', label: '最后游玩时间', key: '最后游玩时间' },
  { id: 'totalPlayCount', label: '游玩次数', key: '游玩次数' },
  { id: 'cover', label: '游戏封面', key: '游戏封面' },
]

type ExportConfig = {
  backgroundColor: string
  titleColor: string
  selectedGameInfo: string[]
  gameCount: number
  templateId: keyof typeof TEMPLATES
}

// 默认配置
const DEFAULT_CONFIG: ExportConfig = {
  backgroundColor: '#1a1a2e',
  titleColor: '#ffffff',
  selectedGameInfo: [
    'playtime',
    'rating',
    'lastPlayed',
    'totalPlayCount',
    'cover',
  ],
  gameCount: 10,
  templateId: 'classic',
}

// 导出数据接口
interface ExportData {
  year: number | null
  yearLabel: string
  totalPlaySeconds: number
  totalPlayHours: number
  totalPlayCount: number
  averageRating: number
  lastPlayedDate: string
  topGames: Array<{
    title: string
    cover: string
    playtime: number
  }>
  entries: Array<{
    id: string
    title: string
    cover: string
    totalPlayHours: number
    rating: number | null
    lastPlayAt: string
  }>
}

// 辅助函数：将 lab/oklch/lch/oklab 颜色转换为 hex
function convertLabToHex(colorStr: string): string {
  // 如果是 oklab() 格式
  const oklabMatch = colorStr.match(
    /oklab\(\s*([\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\)/,
  )
  if (oklabMatch) {
    const L = parseFloat(oklabMatch[1])
    const a = parseFloat(oklabMatch[2])
    const b = parseFloat(oklabMatch[3])

    // 简化的 oklab 到 rgb 转换
    let r = L + a * 1.5
    let g = L - a * 0.5 + b * 0.5
    let blue = L - b * 0.5

    r = Math.max(0, Math.min(255, Math.round(r * 255)))
    g = Math.max(0, Math.min(255, Math.round(g * 255)))
    blue = Math.max(0, Math.min(255, Math.round(blue * 255)))

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
  }

  // 如果是 lab() 格式
  const labMatch = colorStr.match(
    /lab\(\s*([\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s*\)/,
  )
  if (labMatch) {
    // 简化的 lab 到 rgb 转换
    const L = parseFloat(labMatch[1]) / 100
    const a = parseFloat(labMatch[2]) / 100
    const b = parseFloat(labMatch[3]) / 100

    // 简化的转换
    let r = L + a * 1.5
    let g = L - a * 0.5 + b * 0.5
    let blue = L - b * 0.5

    r = Math.max(0, Math.min(255, Math.round(r * 255)))
    g = Math.max(0, Math.min(255, Math.round(g * 255)))
    blue = Math.max(0, Math.min(255, Math.round(blue * 255)))

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
  }

  // 如果是 oklch() 或 lch() 格式
  const lchMatch = colorStr.match(
    /(?:oklch|lch)\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/,
  )
  if (lchMatch) {
    const L = parseFloat(lchMatch[1])
    const C = parseFloat(lchMatch[2])
    const H = parseFloat(lchMatch[3])

    const hRad = (H * Math.PI) / 180
    const r = L + C * Math.cos(hRad)
    const g = L - C * Math.sin(hRad)
    const blue = L - C * Math.cos(hRad)

    return `#${Math.max(0, Math.min(255, Math.round(r * 255)))
      .toString(16)
      .padStart(2, '0')}${Math.max(0, Math.min(255, Math.round(g * 255)))
      .toString(16)
      .padStart(2, '0')}${Math.max(0, Math.min(255, Math.round(blue * 255)))
      .toString(16)
      .padStart(2, '0')}`
  }

  return '#ffffff'
}

// 清理不支持的颜色函数
function cleanColorValue(colorValue: string): string {
  // 处理 lab(), oklch(), lch(), oklab() 等格式
  const processedColor = colorValue.replace(
    /lab\([^)]+\)|oklch\([^)]+\)|lch\([^)]+\)|oklab\([^)]+\)/g,
    (match) => convertLabToHex(match),
  )
  return processedColor
}

// 生成年份选项
function generateYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let year = currentYear; year >= currentYear - 10; year--) {
    years.push(year)
  }
  return years
}

export default function RecordExportPanel() {
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_CONFIG)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(
    new Date().getFullYear(),
  )
  const previewRef = useRef<HTMLDivElement>(null)

  // 获取导出数据
  const { data: exportData, isLoading: isLoadingData } = useQuery({
    queryKey: ['export-data', selectedYear],
    queryFn: async (): Promise<ExportData> => {
      const url = selectedYear
        ? `/record/export?year=${selectedYear}`
        : '/record/export'
      const res = await api.request({
        method: 'GET',
        url,
      })
      if (!res.status || res.status >= 400) {
        throw new Error('Failed to fetch export data')
      }
      return res.data.data
    },
    enabled: true,
  })

  const handleBackgroundColorChange = (color: string) => {
    setConfig((prev) => ({ ...prev, backgroundColor: color }))
  }

  const handleTitleColorChange = (color: string) => {
    setConfig((prev) => ({ ...prev, titleColor: color }))
  }

  const handleGameInfoToggle = (
    infoId: string,
    checked: boolean | 'indeterminate',
  ) => {
    if (checked === true) {
      setConfig((prev) => ({
        ...prev,
        selectedGameInfo: [...prev.selectedGameInfo, infoId],
      }))
    } else {
      setConfig((prev) => ({
        ...prev,
        selectedGameInfo: prev.selectedGameInfo.filter((id) => id !== infoId),
      }))
    }
  }

  const handleGameCountChange = (value: number[]) => {
    setConfig((prev) => ({ ...prev, gameCount: value[0] }))
  }

  const handleTemplateChange = (templateId: string) => {
    setConfig((prev) => ({
      ...prev,
      templateId: templateId as keyof typeof TEMPLATES,
    }))
  }

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG)
  }

  const handleGenerate = async () => {
    if (!previewRef.current) {
      return
    }

    setIsExporting(true)

    try {
      // 等待下一个渲染周期确保 DOM 完全更新
      await new Promise((resolve) => setTimeout(resolve, 100))

      const canvas = await html2canvas(previewRef.current, {
        scale: 2, // 高清导出
        useCORS: true,
        backgroundColor: config.backgroundColor,
        logging: false,
        onclone: (clonedDoc) => {
          // 处理克隆文档中的 lab 颜色
          const allElements = clonedDoc.querySelectorAll('*')
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement
            const computedStyle = window.getComputedStyle(htmlEl)

            // 检查并替换 color 属性中的 lab 颜色
            const colorValue = computedStyle.color
            if (
              colorValue.includes('lab') ||
              colorValue.includes('oklch') ||
              colorValue.includes('oklab') ||
              colorValue.includes('lch')
            ) {
              htmlEl.style.color = cleanColorValue(colorValue)
            }

            // 检查并替换 backgroundColor 属性中的 lab 颜色
            const bgColorValue = computedStyle.backgroundColor
            if (
              bgColorValue.includes('lab') ||
              bgColorValue.includes('oklch') ||
              bgColorValue.includes('oklab') ||
              bgColorValue.includes('lch')
            ) {
              htmlEl.style.backgroundColor = cleanColorValue(bgColorValue)
            }

            // 检查并替换 borderColor 属性中的 lab 颜色
            const borderColorValue = computedStyle.borderColor
            if (
              borderColorValue.includes('lab') ||
              borderColorValue.includes('oklch') ||
              borderColorValue.includes('oklab') ||
              borderColorValue.includes('lch')
            ) {
              htmlEl.style.borderColor = cleanColorValue(borderColorValue)
            }
          })
        },
      })

      // 转换为 PNG 并下载
      const link = document.createElement('a')
      link.download = `游戏报告海报_${selectedYear || '全部'}_${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('导出失败:', error)
    } finally {
      setIsExporting(false)
    }
  }

  // 准备模板数据
  const templateData = exportData
    ? {
        totalHours: exportData.totalPlayHours,
        totalPlayCount: exportData.totalPlayCount,
        averageRating: exportData.averageRating,
        lastPlayedDate: exportData.lastPlayedDate,
        topGames: exportData.topGames.slice(0, config.gameCount),
      }
    : undefined

  const yearOptions = generateYearOptions()

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6">
      {/* 顶部操作区域 */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">导出游戏报告海报</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcwIcon className="size-4" />
            重置配置项
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isExporting || isLoadingData}
          >
            <DownloadIcon className="size-4" />
            {isExporting ? '导出中...' : '生成海报'}
          </Button>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 左侧：配置项 */}
        <div className="space-y-6">
          {/* 年份选择 */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle>导出年份</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year-select">选择要导出的年份</Label>
                <Select
                  value={selectedYear?.toString() || 'all'}
                  onValueChange={(value) =>
                    setSelectedYear(value === 'all' ? null : parseInt(value))
                  }
                >
                  <SelectTrigger id="year-select">
                    <SelectValue placeholder="选择年份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部时间</SelectItem>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year} 年
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {exportData && (
                <div className="text-muted-foreground text-sm">
                  当前数据：{exportData.yearLabel}，共{' '}
                  {exportData.totalPlayHours} 小时游戏时长
                </div>
              )}
            </CardContent>
          </Card>

          {/* 颜色配置 */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle>颜色设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="background-color">海报背景颜色</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="background-color"
                    value={config.backgroundColor}
                    onChange={(e) =>
                      handleBackgroundColorChange(e.target.value)
                    }
                    className="border-input size-10 cursor-pointer rounded-md border"
                  />
                  <Input
                    value={config.backgroundColor}
                    onChange={(e) =>
                      handleBackgroundColorChange(e.target.value)
                    }
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title-color">游戏标题颜色</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="title-color"
                    value={config.titleColor}
                    onChange={(e) => handleTitleColorChange(e.target.value)}
                    className="border-input size-10 cursor-pointer rounded-md border"
                  />
                  <Input
                    value={config.titleColor}
                    onChange={(e) => handleTitleColorChange(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 导出内容配置 */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle>导出内容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>选择要导出的游戏信息</Label>
                <div className="grid grid-cols-2 gap-3">
                  {GAME_INFO_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`game-info-${option.id}`}
                        checked={config.selectedGameInfo.includes(option.id)}
                        onCheckedChange={(checked) =>
                          handleGameInfoToggle(option.id, checked)
                        }
                      />
                      <Label
                        htmlFor={`game-info-${option.id}`}
                        className="cursor-pointer text-sm font-normal"
                      >
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 数量配置 */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle>导出数量</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>导出的游戏数量</Label>
                  <span className="text-sm font-medium">
                    {config.gameCount}
                  </span>
                </div>
                <Slider
                  value={[config.gameCount]}
                  onValueChange={handleGameCountChange}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* 模板选择 */}
          <Card variant="outline">
            <CardHeader>
              <CardTitle>模板选择</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={config.templateId}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择导出模板" />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_META.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* 右侧：海报预览 */}
        <div className="flex flex-col">
          <Card variant="outline" className="flex flex-1 flex-col">
            <CardHeader>
              <CardTitle>海报预览</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 items-center justify-center p-6">
              {isLoadingData ? (
                <div className="text-muted-foreground">加载中...</div>
              ) : (
                /* 动态渲染模板 */
                <div ref={previewRef} className="w-full max-w-md">
                  {(() => {
                    const TemplateComponent = TEMPLATES[config.templateId]
                    const templateProps: TemplateProps = {
                      backgroundColor: config.backgroundColor,
                      titleColor: config.titleColor,
                      selectedGameInfo: config.selectedGameInfo,
                      gameCount: config.gameCount,
                      year: selectedYear || undefined,
                      data: templateData,
                    }
                    return <TemplateComponent {...templateProps} />
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
