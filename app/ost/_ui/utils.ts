import dayjs from 'dayjs'

/**
 * 格式化日期显示
 */
export function toDisplayDate(date: string | null | undefined): string {
  if (!date) return '-'
  const d = dayjs(date)
  return d.isValid() ? d.format('YYYY-MM-DD') : '-'
}

/**
 * 搜索 khinsider 专辑 (通过 API 代理)
 */
export async function searchAlbums(kw: string) {
  const url = `/api/ost/khinsider?kw=${encodeURIComponent(kw)}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`)
  }

  const json = await res.json()
  return json.data as Array<{
    name: string
    url: string
    type: 'album' | 'soundtrack'
    cover: string
    year?: string
  }>
}

/**
 * 获取专辑详情 (通过 API 代理)
 */
export async function getAlbumDetails(albumUrl: string) {
  const url = `/api/ost/khinsider/album?url=${encodeURIComponent(albumUrl)}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Get album details failed: ${res.statusText}`)
  }

  const json = await res.json()
  return json.data as {
    name: string
    covers: string[]
    songs: Array<{ name: string; url: string; duration?: string }>
  }
}
