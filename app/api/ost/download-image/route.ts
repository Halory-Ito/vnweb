import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 下载图片到本地
 * POST /api/ost/download-image
 * Body: { imageUrl: string, ostId: number, ostName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      imageUrl?: string
      ostId?: number
      ostName?: string
    }

    const { imageUrl, ostId, ostName } = body

    if (!imageUrl || !ostId) {
      return NextResponse.json(
        { error: 'Missing imageUrl or ostId' },
        { status: 400 },
      )
    }

    if (!ostName) {
      return NextResponse.json({ error: 'Missing ostName' }, { status: 400 })
    }

    // 创建目录
    const assetsDir = path.join(process.cwd(), 'assets', 'ost')
    const ostDir = path.join(assetsDir, String(ostId))

    if (!fs.existsSync(ostDir)) {
      fs.mkdirSync(ostDir, { recursive: true })
    }

    // 生成文件名
    const sanitizedName = ostName.replace(/[/\\?%*:|"<>]/g, '-')
    const fileName = `${sanitizedName}.png`
    const localPath = `/assets/ost/${ostId}/${fileName}`
    const fullPath = path.join(ostDir, fileName)

    // 下载图片
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to download image' },
        { status: 500 },
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 保存到本地
    fs.writeFileSync(fullPath, buffer)

    return NextResponse.json({
      data: {
        localPath,
      },
    })
  } catch (error) {
    console.error('Download image failed:', error)
    return NextResponse.json(
      { error: 'Failed to download image' },
      { status: 500 },
    )
  }
}
