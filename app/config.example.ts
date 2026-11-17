// STEAM API Key, get from https://steamcommunity.com/dev/apikey
export const NEXT_PUBLIC_STEAM_API_KEY = ''

// STEAM GRID API Key, get from https://www.steamgriddb.com/profile/preferences/api
export const NEXT_PUBLIC_STEAMGRIDDB_API_KEY = ''
export const NEXT_PUBLIC_STEAMGRIDDB_BASE_URL = 'https://www.steamgriddb.com/api/v2'

// BANGUMI API Key, get from https://next.bgm.tv/demo/access-token
export const NEXT_PUBLIC_BANGUMI_API_KEY = ''
// export const NEXT_PUBLIC_BANGUMI_API_URL = 'https://api.bgm.tv'
// 2026年6月前，bangumi被ban，现在用镜像API
export const NEXT_PUBLIC_BANGUMI_API_URL = 'https://bgmapi.anibt.net'
export const NEXT_PUBLIC_BANGUMI_BASE_URL = 'https://bgmmi.anibt.net/'

// BANGUMI OAuth Client ID and Secret, get from https://bgm.tv/dev/app/create
export const BANGUMI_OAUTH_CLIENT_ID = ''
export const BANGUMI_OAUTH_CLIENT_SECRET = ''

// VNDB API Key, get from https://vndb.org/u335444/edit#api
export const VNDB_OAUTH_TOKEN = ''

export const YMGAL_CLIENT_ID = 'ymgal'
export const YMGAL_CLIENT_SECRET = 'luna0327'
export const YMGAL_BASE_URL = 'https://www.ymgal.games'

export const YMGAL_OAUTH_CLIENT_ID = process.env.YMGAL_OAUTH_CLIENT_ID || 'vnweb'
export const YMGAL_OAUTH_CLIENT_SECRET = process.env.YMGAL_OAUTH_CLIENT_SECRET || ''

// Meting API：地址与可选请求鉴权；返回的歌曲 URL 签名保持原样
export const METING_API_BASE = process.env.METING_API_BASE || 'https://api.i-meto.com/meting/api'
export const METING_API_AUTH = process.env.METING_API_AUTH || ''

// 网易云专辑搜索与元数据接口；音频与歌词仍由 Meting 提供
export const NETEASE_API_BASE = process.env.NETEASE_API_BASE || 'https://music.163.com/api'
