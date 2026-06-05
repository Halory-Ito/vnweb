import { api } from '@/lib/request-utils'

const BASE_URL = 'https://music.163.com/#/album'

const example_id = '493782'

/**
 * 网易云音乐专辑搜索
 */
export async function searchNeteaseAlbums(
  keyword: string,
): Promise<import('../../_ui/types').NeteaseAlbum[]> {
  const response = await api.get('/ost/netease', {
    params: { kw: keyword },
  })
  return response.data.data
}

/**
 * 获取网易云音乐专辑详情
 */
export async function getNeteaseAlbumDetails(
  id: string,
): Promise<import('../../_ui/types').NeteaseAlbumDetails> {
  const response = await api.get(`/ost/netease/${id}`, {
    params: { id },
  })
  return response.data.data
}
