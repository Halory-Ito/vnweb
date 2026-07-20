import { api } from '@/lib/request-utils'

export type GuideSearchResult = {
  uid: string
  cover: string
  name: {
    'zh-cn': string
    'en-us': string
    'ja-jp': string
  }
  developer: string
  romaji: string
  tags: string[]
  level: number
  tips: string[]
  routes: GuideRoute[]
}

export type GuideRoute = {
  id: string
  name: string
  endings: GuideEnding[]
}

export type GuideEnding = {
  id: string
  name: string
  type: string
  steps: GuideStep[]
  requirements?: string
}

export type GuideStep = {
  id: string
  type: string
  content: string
  group?: string
  prefix?: string
  subfix?: string
  finished?: boolean
}

export type GuideSearchResponse = {
  total: number
  list: GuideSearchResult[]
  page: number
  pageSize: number
}

export type ImportGuideParams = {
  gameId: number
  guide: GuideSearchResult
}

export type GuideData = {
  id: number
  gameId: number
  name: string
  cover: string
  level: number
  tips: string[]
  finished: boolean
  routes: GuideRouteWithProgress[]
}

export type GuideRouteWithProgress = GuideRoute & {
  id: string
  finished: boolean
  endings: GuideEndingWithProgress[]
}

export type GuideEndingWithProgress = GuideEnding & {
  id: string
  finished: boolean
  steps: GuideStepWithProgress[]
}

export type GuideStepWithProgress = GuideStep & {
  id: string
  finished: boolean
}

export type UpdateGuideProgressParams = {
  type: 'step' | 'ending' | 'route' | 'guide'
  id: number
  finished: boolean
}

// 搜索攻略
export async function searchGuidesApi(
  keyword: string,
  page = 1,
  pageSize = 12,
): Promise<GuideSearchResponse> {
  const res = await api.request({
    method: 'GET',
    url: '/guide/search',
    params: { q: keyword, page, pageSize },
  })
  return res.data
}

// 导入攻略
export async function importGuideApi(params: ImportGuideParams): Promise<void> {
  await api.request({
    method: 'POST',
    url: '/guide/import',
    data: params,
  })
}

// 获取游戏攻略
export async function getGuideApi(gameId: number): Promise<GuideData | null> {
  const res = await api.request({
    method: 'GET',
    url: `/guide/${gameId}`,
  })
  return res.data
}

// 更新攻略进度
export async function updateGuideProgressApi(
  gameId: number,
  params: UpdateGuideProgressParams,
): Promise<void> {
  await api.request({
    method: 'PATCH',
    url: `/guide/${gameId}/progress`,
    data: params,
  })
}
