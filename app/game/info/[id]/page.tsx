'use client'

import { useParams } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function GameInfo() {
  const params = useParams<{ id: string }>()
  const [exePath, setExePath] = useState(
    'E:\\VN\\Key\\Rewrite+\\Rewrite+原版.exe',
  )
  const [iconSavePath, setIconSavePath] = useState('D:\\temp\\iii.ico')
  const [data, setData] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setError('')

    if (!exePath.trim() || !iconSavePath.trim()) {
      setError('请填写 exe 路径和 icon 保存路径')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/game/extract-icon', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exePath, iconSavePath }),
      })

      const result = (await response.json()) as {
        data?: { iconPath: string }
        error?: string
      }

      if (!response.ok || !result?.data?.iconPath) {
        throw new Error(result.error || '图标提取失败')
      }

      setData(result.data.iconPath)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      GameId: {params.id}
      <Input
        value={exePath}
        onChange={(event) => setExePath(event.target.value)}
        placeholder="请输入 exe 文件路径"
      />
      <Input
        value={iconSavePath}
        onChange={(event) => setIconSavePath(event.target.value)}
        placeholder="请输入 icon 保存路径"
      />
      <Button onClick={handleClick} disabled={loading}>
        {loading ? 'Extracting...' : 'Extract Icon'}
      </Button>
      <div>{data}</div>
      <div>{error}</div>
    </div>
  )
}
