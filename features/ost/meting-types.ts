export const METING_SERVERS = {
  netease: '网易云音乐',
  tencent: 'QQ 音乐',
  kugou: '酷狗音乐',
  kuwo: '酷我音乐',
  baidu: '百度音乐',
} as const
export const METING_TYPES = { album: '专辑', playlist: '歌单', song: '单曲' } as const
export type MetingServer = keyof typeof METING_SERVERS
export type MetingType = keyof typeof METING_TYPES
export type MetingInput = { server: MetingServer; type: MetingType | 'search'; id: string }
export type MetingMediaType = 'url' | 'lyric' | 'pic'
export const METING_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/

export function metingMediaPath(server: MetingServer, type: MetingMediaType, id: string): string {
  return '/api/ost/meting?' + new URLSearchParams({ server, type, id })
}

export function getMetingMediaRef(url: string, type: MetingMediaType | 'lrc') {
  if (!/^https?:\/\//i.test(url)) return
  try {
    const params = new URL(url).searchParams
    const server = params.get('server')
    const id = params.get('id')
    if (
      server &&
      Object.hasOwn(METING_SERVERS, server) &&
      id &&
      METING_ID_PATTERN.test(id) &&
      params.get('type') === type
    ) {
      return { server: server as MetingServer, id }
    }
  } catch {
    return undefined
  }
}
export function parseMetingRef(ref: string): MetingInput {
  const parts = ref.split(':')
  const [server, type, id] = parts.length === 1 ? ['netease', 'album', ref] : parts
  if (parts.length !== 1 && parts.length !== 3) throw new Error('无效的 Meting 引用')
  if (
    !Object.hasOwn(METING_SERVERS, server) ||
    !Object.hasOwn(METING_TYPES, type) ||
    !METING_ID_PATTERN.test(id)
  )
    throw new Error('无效的 Meting 引用')
  return { server: server as MetingServer, type: type as MetingType, id }
}
