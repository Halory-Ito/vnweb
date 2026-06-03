import { beforeEach, describe, expect, test, vi } from 'vitest'

import type { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => {
  const axiosGet = vi.fn(
    async (): Promise<{
      data: { total: number; items: Array<{ id?: number; name?: string }> }
    }> => ({ data: { total: 0, items: [] } }),
  )
  const fetchSteamAppDetails = vi.fn(
    async (): Promise<Record<string, unknown> | null> => null,
  )
  const toSteamStoreUrl = vi.fn(
    (appid: number) => `https://store.steampowered.com/app/${appid}`,
  )
  const getEnabledProxySettings = vi.fn(async () => null)
  const HttpsProxyAgent = vi.fn(
    class {
      proxyUrl: string
      constructor(proxyUrl: string) {
        this.proxyUrl = proxyUrl
      }
    },
  )

  return {
    axiosGet,
    fetchSteamAppDetails,
    toSteamStoreUrl,
    getEnabledProxySettings,
    HttpsProxyAgent,
  }
})

vi.mock('axios', () => ({ default: { get: mocks.axiosGet } }))
vi.mock('https-proxy-agent', () => ({ HttpsProxyAgent: mocks.HttpsProxyAgent }))
vi.mock('@/lib/settings/proxy-settings', () => ({
  getEnabledProxySettings: mocks.getEnabledProxySettings,
}))
vi.mock('@/app/api/game/steam-import/_shared', () => ({
  fetchSteamAppDetails: mocks.fetchSteamAppDetails,
  toSteamStoreUrl: mocks.toSteamStoreUrl,
}))
vi.mock('../_shared', () => ({
  fetchSteamAppDetails: mocks.fetchSteamAppDetails,
  toSteamStoreUrl: mocks.toSteamStoreUrl,
}))

import { GET, POST } from '@/app/api/game/steam-import/name-search/route'

const createPostRequest = (payload: unknown): NextRequest =>
  ({ json: async () => payload }) as NextRequest
const createGetRequest = (id?: string): NextRequest => {
  const url = new URL('http://localhost/api/game/steam-import/name-search')
  if (id !== undefined) url.searchParams.set('id', id)
  return { nextUrl: url } as NextRequest
}

describe('app/api/game/steam-import/name-search route', () => {
  beforeEach(() => {
    mocks.axiosGet.mockReset()
    mocks.axiosGet.mockResolvedValue({ data: { total: 0, items: [] } })

    mocks.fetchSteamAppDetails.mockReset()
    mocks.fetchSteamAppDetails.mockResolvedValue(null)

    mocks.toSteamStoreUrl.mockReset()
    mocks.toSteamStoreUrl.mockImplementation(
      (appid: number) => `https://store.steampowered.com/app/${appid}`,
    )

    mocks.getEnabledProxySettings.mockReset()
    mocks.getEnabledProxySettings.mockResolvedValue(null)

    mocks.HttpsProxyAgent.mockClear()
  })

  test('POST returns empty result when keyword is blank', async () => {
    const response = await POST(createPostRequest({ keyword: ' ' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ data: { total: 0, items: [] } })
    expect(mocks.axiosGet).not.toHaveBeenCalled()
  })

  test('POST searches by name and slices by offset/limit', async () => {
    // Step 1: 模拟 Steam 商店搜索返回。
    mocks.axiosGet.mockResolvedValueOnce({
      data: {
        total: 3,
        items: [
          { id: 11, name: 'A' },
          { id: 12, name: 'B' },
          { id: 13, name: 'C' },
        ],
      },
    })

    // Step 2: 调用搜索接口。
    const response = await POST(
      createPostRequest({ keyword: 'abc', offset: 1, limit: 2 }),
    )
    const body = await response.json()

    // Step 3: 断言分页切片结果。
    expect(response.status).toBe(200)
    expect(body.data.total).toBe(3)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.items[0]).toMatchObject({ id: '12', name: 'B' })
  })

  test('POST filters invalid ids and normalizes empty names', async () => {
    mocks.axiosGet.mockResolvedValueOnce({
      data: {
        total: 3,
        items: [
          { id: 0, name: 'x' },
          { id: 20, name: '  ' },
          { id: 21, name: 'Name' },
        ],
      },
    })

    const response = await POST(
      createPostRequest({ keyword: 'abc', offset: -1, limit: 100 }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.items[0]).toMatchObject({ id: '20', name: 'Steam App 20' })
    expect(body.data.items[1]).toMatchObject({ id: '21', name: 'Name' })
  })

  test('POST uses proxy settings when enabled', async () => {
    mocks.getEnabledProxySettings.mockResolvedValueOnce({
      enabled: true,
      type: 'http',
      host: '127.0.0.1',
      port: 7890,
      username: 'u',
      password: 'p',
    } as any)
    mocks.axiosGet.mockResolvedValueOnce({ data: { total: 0, items: [] } })

    const response = await POST(createPostRequest({ keyword: 'proxy' }))

    expect(response.status).toBe(200)
    expect(mocks.HttpsProxyAgent).toHaveBeenCalledTimes(1)
    expect(mocks.axiosGet).toHaveBeenCalledWith(
      'https://store.steampowered.com/api/storesearch/',
      expect.objectContaining({ httpsAgent: expect.any(Object) }),
    )
  })

  test('POST returns 500 when steam search request fails', async () => {
    mocks.axiosGet.mockRejectedValueOnce(new Error('steam search failed'))

    const response = await POST(createPostRequest({ keyword: 'abc' }))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('steam search failed')
  })

  test('GET returns 400 for invalid appid', async () => {
    const response = await GET(createGetRequest('x'))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toEqual({ error: '无效的 appid' })
  })

  test('GET returns 404 when details are not found', async () => {
    mocks.fetchSteamAppDetails.mockResolvedValueOnce(null)

    const response = await GET(createGetRequest('10'))
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toEqual({ error: '未找到 Steam 游戏详情' })
  })

  test('GET returns normalized steam game metadata', async () => {
    mocks.fetchSteamAppDetails.mockResolvedValueOnce({
      name: 'Steam Game',
      short_description: 'desc',
      header_image: 'cover.jpg',
      release_date: { date: '2025-01-01' },
      platforms: { windows: true, mac: true, linux: false },
      developers: ['Dev'],
      publishers: ['Pub'],
    })

    const response = await GET(createGetRequest('10'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.name).toBe('Steam Game')
    expect(body.data.platforms).toEqual(['Windows', 'macOS'])
    expect(body.data.websites).toEqual([
      {
        Steam: 'https://store.steampowered.com/app/10',
      },
    ])
  })

  test('GET returns defaults when steam detail fields are missing', async () => {
    mocks.fetchSteamAppDetails.mockResolvedValueOnce({})

    const response = await GET(createGetRequest('99'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.data.name).toBe('Steam App 99')
    expect(body.data.platforms).toEqual([])
  })

  test('GET returns 500 when fetching details throws', async () => {
    mocks.fetchSteamAppDetails.mockRejectedValueOnce(new Error('detail failed'))

    const response = await GET(createGetRequest('10'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('detail failed')
  })
})
