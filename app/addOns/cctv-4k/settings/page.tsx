'use client'

import { CheckCircle2, Link2, MonitorPlay, Save } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { CCTV_M3U8_STORAGE_KEY } from '../utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function Settings() {
  const [m3u8Url, setM3u8Url] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const savedUrl = window.localStorage.getItem(CCTV_M3U8_STORAGE_KEY) || ''
    setM3u8Url(savedUrl)
  }, [])

  const saveSettings = () => {
    window.localStorage.setItem(CCTV_M3U8_STORAGE_KEY, m3u8Url.trim())
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <Card variant="outline">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-red-500" />
            直播源设置
          </CardTitle>
          <CardDescription>
            配置 m3u8 播放列表链接，用于在首页加载频道并进行节目切换。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">M3U8 链接</p>
            <Input
              placeholder="https://example.com/live.m3u8"
              value={m3u8Url}
              onChange={(event) => setM3u8Url(event.target.value)}
            />
            <p className="text-muted-foreground text-xs leading-5">
              提示：如果播放失败，请确认链接可访问并允许跨域请求（CORS）。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={saveSettings} disabled={!m3u8Url.trim()}>
              <Save className="mr-2 size-4" />
              保存设置
            </Button>
            <Button variant="outline" asChild>
              <Link href="/addOns/cctv-4k/home">
                <MonitorPlay className="mr-2 size-4" />
                前往播放页
              </Link>
            </Button>
            {saved && (
              <span className="flex items-center text-sm text-emerald-600">
                <CheckCircle2 className="mr-1 size-4" />
                已保存
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
