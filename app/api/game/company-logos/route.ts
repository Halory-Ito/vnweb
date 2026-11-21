import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { isAppearanceImageUrl } from '@/lib/settings/appearance-image'

const companySchema = z.object({
  id: z.string(),
  display_name: z.string().trim().min(1),
  logo: z.object({ url: z.string().url() }),
})
const resultSchema = z.object({ items: z.array(z.unknown()) })

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (!q || q.length > 100) {
    return NextResponse.json({ error: '请输入 1 至 100 个字符的会社名称' }, { status: 400 })
  }

  const url = new URL('https://www.kungal.com/api/v1/companies')
  url.search = new URLSearchParams({ q, limit: '100' }).toString()

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(8_000)]),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Unexpected HTTP status: ${response.status}`)

    const { items } = resultSchema.parse(await response.json())
    const results = items.flatMap((item) => {
      const parsed = companySchema.safeParse(item)
      if (!parsed.success || !isAppearanceImageUrl(parsed.data.logo.url)) return []
      const { id, display_name: name, logo } = parsed.data
      return [{ id, name, logoUrl: logo.url }]
    })
    return NextResponse.json({ data: results })
  } catch {
    return NextResponse.json({ error: '会社 LOGO 搜索失败，请稍后重试' }, { status: 502 })
  }
}
