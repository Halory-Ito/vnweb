import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import SGDB from 'steamgriddb'

import { getBoundThirdPartyAccount } from '@/app/api/game/third-party-import/_shared'
import { readPlatformSettings, resolveBangumiEndpoints } from '@/lib/server/platform-settings'

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0'

type BgmRequestConfig = InternalAxiosRequestConfig & {
  _bgmAutoAuth?: boolean
  _bgmSkipAutoAuth?: boolean
}

export const BGMClient = axios.create({
  headers: { 'User-Agent': userAgent },
})

BGMClient.interceptors.request.use(async (rawConfig) => {
  const config = rawConfig as BgmRequestConfig
  const [{ bangumi }, account] = await Promise.all([
    readPlatformSettings(),
    config._bgmSkipAutoAuth ? Promise.resolve(null) : getBoundThirdPartyAccount('bangumi'),
  ])
  config.baseURL = resolveBangumiEndpoints(bangumi).apiUrl
  const token = account?.accessToken?.trim()
  if (token && !config._bgmSkipAutoAuth && !config.headers.has('Authorization')) {
    config.headers.set('Authorization', `Bearer ${token}`)
    config._bgmAutoAuth = true
  }
  return config
})

BGMClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401 || !error.config) {
    throw error
  }
  const config = error.config as BgmRequestConfig
  if (!config._bgmAutoAuth || config._bgmSkipAutoAuth) {
    throw error
  }
  const headers = AxiosHeaders.from(config.headers)
  headers.delete('Authorization')
  return BGMClient.request({
    ...config,
    headers,
    _bgmAutoAuth: false,
    _bgmSkipAutoAuth: true,
  } as BgmRequestConfig)
})

let sgdb: { apiKey: string; baseUrl: string; client: SGDB } | undefined

async function getSGDBClient(): Promise<SGDB> {
  const {
    steamgriddb: { apiKey, baseUrl },
  } = await readPlatformSettings()
  if (!apiKey) throw new Error('未配置 SteamGridDB API Key，请检查平台设置')

  const resolvedBaseUrl = baseUrl || 'https://www.steamgriddb.com/api/v2'
  if (sgdb?.apiKey !== apiKey || sgdb.baseUrl !== resolvedBaseUrl) {
    sgdb = {
      apiKey,
      baseUrl: resolvedBaseUrl,
      client: new SGDB({ key: apiKey, baseURL: resolvedBaseUrl }),
    }
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
