const BASE_URL = 'https://music.163.com/#/album'

const example_id = '493782'

/**
 * 网易云音乐专辑搜索
 */
export async function searchNeteaseAlbums(
  keyword: string,
): Promise<import('../../_ui/types').NeteaseAlbum[]> {
  const response = await fetch(
    `/api/ost/netease?kw=${encodeURIComponent(keyword)}`,
  )
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '搜索失败')
  }
  return data.data
}

/**
 * 获取网易云音乐专辑详情
 */
export async function getNeteaseAlbumDetails(
  id: string,
): Promise<import('../../_ui/types').NeteaseAlbumDetails> {
  const response = await fetch(`/api/ost/netease/${id}?id=${id}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || '获取专辑详情失败')
  }
  return data.data
}
