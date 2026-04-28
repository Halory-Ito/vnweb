import { NextRequest, NextResponse } from 'next/server'

const KHINSIDER_BASE = 'https://downloads.khinsider.com'

/**
 * 搜索 khinsider 专辑
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const kw = searchParams.get('kw')

    if (!kw) {
      return NextResponse.json(
        { error: 'Missing kw parameter' },
        { status: 400 },
      )
    }

    const url = `${KHINSIDER_BASE}/search?search=${encodeURIComponent(kw)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: KHINSIDER_BASE,
        Origin: KHINSIDER_BASE,
      },
    })

    const html = await res.text()

    const results: Array<{
      name: string
      url: string
      type: 'album' | 'soundtrack'
      cover: string
      year?: string
    }> = []

    // Khinsider 搜索结果表格结构:
    // <table class="albumList">
    //   <tr>
    //     <td class="albumIcon"><a href="/game-soundtracks/album/..."><img src="封面URL"/></a></td>
    //     <td><a href="/game-soundtracks/album/...">专辑名称</a><span>...</span></td>
    //     <td><a href="/game-soundtracks/平台">平台</a></td>
    //     <td>类型</td>
    //     <td>年份</td>
    //   </tr>
    // </table>

    // 匹配表格中的专辑行（跳过表头 tr）
    const rowPattern =
      /<tr>\s*<td class="albumIcon">\s*<a href="(\/game-soundtracks\/album\/[^"]+)">\s*<img src="([^"]+)"/gi

    let match
    while ((match = rowPattern.exec(html)) !== null) {
      const albumPath = match[1]
      const coverUrl = match[2]

      // 从路径提取专辑 slug
      const slugMatch = albumPath.match(/\/album\/([^/]+)/)
      if (!slugMatch) continue

      const albumSlug = slugMatch[1]

      // 在同一行中查找专辑名称、类型和年份
      // 需要在同一 <tr> 中查找其他 <td> 内容
      // 找到当前匹配位置到下一个 </tr> 之间的内容
      const rowStart = match.index
      const rowEnd = html.indexOf('</tr>', rowStart)
      const rowHtml = html.slice(rowStart, rowEnd)

      // 提取专辑名称（td 中的第二个 <a> 标签文本，跳过 <span>）
      const nameMatch = rowHtml.match(
        /<td[^>]*>\s*<a href="[^"]*">([^<]+)<\/a>(?:\s*<span[^>]*>.*?<\/span>)?/,
      )
      const albumName = nameMatch
        ? nameMatch[1].trim()
        : albumSlug.replace(/-/g, ' ')

      // 提取类型（倒数第二个 td）
      const typeMatch = rowHtml.match(
        /<td[^>]*>\s*(Soundtrack|Gamerip|Compilation|Singles|Arrangements|Remixes|Inspired\s+By)\s*<\/td>/i,
      )
      const albumType = typeMatch
        ? (typeMatch[1].toLowerCase() as
            | 'soundtrack'
            | 'gamerip'
            | 'compilation'
            | 'singles'
            | 'arrangements'
            | 'remixes'
            | 'inspired')
        : 'album'

      // 提取年份（最后一个 td）
      const yearMatch = rowHtml.match(/<td[^>]*>\s*(\d{4})\s*<\/td>/)
      const year = yearMatch ? yearMatch[1] : undefined

      const albumUrl = new URL(albumPath, KHINSIDER_BASE).href

      // 检查是否已存在
      const exists = results.some((r) => r.url === albumUrl)
      if (!exists) {
        results.push({
          name: albumName,
          url: albumUrl,
          type: albumType === 'soundtrack' ? 'soundtrack' : 'album',
          cover: coverUrl,
          year,
        })
      }
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Search albums failed:', error)
    return NextResponse.json(
      { error: 'Failed to search albums' },
      { status: 500 },
    )
  }
}
