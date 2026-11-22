import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { downloadLibraryLogo } from '@/lib/server/download-library-logo'
import { decodeLibraryLogo, writeLibraryLogoImage } from '@/lib/server/library-folder-logo-files'
import {
  isCollectionFolderHref,
  isDeveloperFolderHref,
  readLibraryFolderLogos,
  writeLibraryFolderLogo,
} from '@/lib/server/library-folder-logos'
import { isAppearanceImageSource } from '@/lib/settings/appearance-image'

const payload = z.object({
  href: z.string().refine((href) => isDeveloperFolderHref(href) || isCollectionFolderHref(href)),
  source: z.string().refine(isAppearanceImageSource).nullable(),
  download: z.boolean().optional(),
})

export async function GET() {
  try {
    return NextResponse.json({ data: await readLibraryFolderLogos() })
  } catch {
    return NextResponse.json({ error: '无法读取文件夹 LOGO。' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const parsed = payload.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: '文件夹或图片来源无效。' }, { status: 400 })
  }

  const { href, download } = parsed.data
  let { source } = parsed.data
  const isEmbedded = source !== null && /^data:/i.test(source)
  if (isCollectionFolderHref(href) && (download || (source !== null && !isEmbedded))) {
    return NextResponse.json({ error: '收藏夹 LOGO 仅支持本地上传。' }, { status: 400 })
  }
  if (source && (download || isEmbedded)) {
    try {
      const bytes = download ? await downloadLibraryLogo(source) : decodeLibraryLogo(source)
      source = await writeLibraryLogoImage(bytes)
    } catch (error) {
      const message =
        error instanceof Error && !('code' in error) ? error.message : '无法读取图片。'
      return NextResponse.json({ error: message }, { status: 422 })
    }
  }

  try {
    await writeLibraryFolderLogo(href, source)
    return NextResponse.json({ data: { href, source } })
  } catch {
    return NextResponse.json({ error: '无法保存文件夹 LOGO。' }, { status: 500 })
  }
}
