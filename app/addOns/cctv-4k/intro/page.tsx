'use client'

import { MonitorPlay, Route, Settings2, Tv } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    title: 'M3U8 直播解析',
    description: '支持读取标准 m3u8 播放列表，自动提取频道名称与直播地址。',
    icon: Route,
  },
  {
    title: '频道快速切换',
    description: '在播放页右侧频道列表中一键切台，适合多节目源连续观看。',
    icon: Tv,
  },
  {
    title: '独立配置存储',
    description: '插件设置与主站点解耦，m3u8 地址单独保存，便于后续维护。',
    icon: Settings2,
  },
]

const guideSteps = [
  '打开“插件设置”，填入可访问的 m3u8 播放列表链接。',
  '保存设置后进入“插件首页”，系统会自动拉取并解析频道。',
  '点击任意频道开始播放，如播放失败请检查源地址可用性与跨域策略。',
]

export default function Intro() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 md:p-6">
      <Card
        variant="outline"
        className="via-background to-background overflow-hidden border-red-500/25 bg-linear-to-br from-red-500/10"
      >
        <CardContent className="p-6 md:p-8">
          <Badge className="mb-3 bg-red-500/85 text-white">CCTV 4K 插件</Badge>
          <h1 className="mb-2 text-2xl font-semibold md:text-3xl">
            央视直播聚合与快速切换
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
            基于 m3u8 节目源的轻量直播插件，提供配置、解析与播放一体化体验。
          </p>
          <div className="mt-5 flex gap-3">
            <Button asChild>
              <Link href="/addOns/cctv-4k/home">
                <MonitorPlay className="mr-2 size-4" />
                进入插件首页
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/addOns/cctv-4k/settings">前往设置</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {features.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} variant="outline">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="size-4 text-red-500" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  {item.description}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card variant="outline">
        <CardHeader>
          <CardTitle className="text-base">使用指南</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {guideSteps.map((step, index) => (
            <div key={step} className="flex items-start gap-3">
              <div className="bg-muted text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded-full text-xs">
                {index + 1}
              </div>
              <p className="text-sm leading-6">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
