import axios from 'axios'
import SGDB from 'steamgriddb'

const getPublicEnv = (key: string): string | undefined => {
  if (typeof import.meta !== 'undefined') {
    const value = (
      import.meta as ImportMeta & { env?: Record<string, string | undefined> }
    ).env?.[key]
    if (value) {
      return value
    }
  }

  if (typeof globalThis !== 'undefined') {
    const value = (
      globalThis as { process?: { env?: Record<string, string | undefined> } }
    ).process?.env?.[key]
    if (value) {
      return value
    }
  }

  return undefined
}

// bgm client
export const BGMClient = axios.create({
  baseURL: getPublicEnv('NEXT_PUBLIC_BANGUMI_BASE_URL'),
  timeout: undefined,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
    'Access-Token': getPublicEnv('NEXT_PUBLIC_BANGUMI_API_KEY'),
  },
})

// steamgriddb client
export const SGDBClient = new SGDB({
  key: getPublicEnv('NEXT_PUBLIC_STEAMGRIDDB_API_KEY') || '',
  baseURL:
    getPublicEnv('NEXT_PUBLIC_STEAMGRIDDB_BASE_URL') ||
    'https://www.steamgriddb.com/api/v2',
})

// steam client
export const SteamClient = axios.create({
  baseURL: 'https://api.steampowered.com',
  timeout: undefined,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0',
  },
})
