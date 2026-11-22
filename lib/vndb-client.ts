import axios from 'axios'
import SGDB from 'steamgriddb'

import { readPlatformSettings, resolveBangumiEndpoints } from '@/lib/server/platform-settings'

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0'

export const BGMClient = axios.create({
  headers: { 'User-Agent': userAgent },
})

BGMClient.interceptors.request.use(async (config) => {
  const { bangumi } = await readPlatformSettings()
  config.baseURL = resolveBangumiEndpoints(bangumi).apiUrl
  if (bangumi.apiKey && !config.headers.has('Access-Token')) {
    config.headers.set('Access-Token', bangumi.apiKey)
  }
  return config
})

let sgdb: { apiKey: string; baseUrl: string; client: SGDB } | undefined

async function getSGDBClient(): Promise<SGDB> {
  const {
    steamgriddb: { apiKey, baseUrl },
  } = await readPlatformSettings()
  if (!apiKey) throw new Error('未配置 SteamGridDB API Key，请检查平台设置')

  if (sgdb?.apiKey !== apiKey || sgdb.baseUrl !== baseUrl) {
    sgdb = { apiKey, baseUrl, client: new SGDB({ key: apiKey, baseURL: baseUrl }) }
  }
  return sgdb.client
}

type SGDBClientMethods = Pick<
  SGDB,
  'searchGame' | 'getGameById' | 'getGridsById' | 'getIconsById' | 'getLogosById' | 'getHeroesById'
>

export const SGDBClient: SGDBClientMethods = {
  searchGame: async (...args) => (await getSGDBClient()).searchGame(...args),
  getGameById: async (...args) => (await getSGDBClient()).getGameById(...args),
  getGridsById: async (...args) => (await getSGDBClient()).getGridsById(...args),
  getIconsById: async (...args) => (await getSGDBClient()).getIconsById(...args),
  getLogosById: async (...args) => (await getSGDBClient()).getLogosById(...args),
  getHeroesById: async (...args) => (await getSGDBClient()).getHeroesById(...args),
}

export const SteamClient = axios.create({
  baseURL: 'https://api.steampowered.com',
  headers: { 'User-Agent': userAgent },
})

export const VNDBClient = axios.create({
  headers: { 'Content-Type': 'application/json', 'User-Agent': userAgent },
})

VNDBClient.interceptors.request.use(async (config) => {
  const { vndb } = await readPlatformSettings()
  config.baseURL = vndb.baseUrl
  return config
})
