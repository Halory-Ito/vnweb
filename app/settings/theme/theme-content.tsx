'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/request-utils'

type ThemeCssResponse = {
  data?: {
    content?: string
  }
  error?: string
}

export default function ThemeContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')

  useEffect(() => {
    const loadThemeCss = async () => {
      setIsLoading(true)
      try {
        const response = await api.get('/settings/theme-css')
        const payload = response.data as ThemeCssResponse

        const nextContent = payload.data?.content ?? ''
        setContent(nextContent)
        setSavedContent(nextContent)
      } catch (error) {
        toast.error((error as Error).message || '读取主题文件失败')
      } finally {
        setIsLoading(false)
      }
    }

    void loadThemeCss()
  }, [])

  const hasChanges = useMemo(
    () => content !== savedContent,
    [content, savedContent],
  )

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await api.put('/settings/theme-css', { content })
      const payload = response.data as ThemeCssResponse

      setSavedContent(content)
      toast.success('主题文件已保存')
    } catch (error) {
      toast.error((error as Error).message || '保存主题文件失败')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setContent(savedContent)
  }

  return (
    <div className="space-y-4 py-3">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">自定义主题</h3>
      </div>

      <Textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        className="min-h-105 font-mono text-xs leading-5"
        spellCheck={false}
        disabled={isLoading || isSaving}
        placeholder={isLoading ? '正在读取主题文件...' : '请输入 CSS 内容'}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void handleSave()}
          disabled={isLoading || isSaving || !hasChanges}
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={isLoading || isSaving || !hasChanges}
        >
          撤销修改
        </Button>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          disabled={isLoading || isSaving}
        >
          刷新页面
        </Button>
      </div>

      <Card variant="outline">
        <CardContent color="">主题可以从 tweakcn 网站查找</CardContent>
      </Card>
    </div>
  )
}
