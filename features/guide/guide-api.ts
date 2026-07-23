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
  cover?: string
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

export type GuideListItem = {
  id: number
  gameId: number
  name: string
  cover: string
  totalSteps: number
  completedSteps: number
  percentage: number
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

// 获取攻略列表
export async function getGuideListApi(): Promise<GuideListItem[]> {
  const res = await api.request({
    method: 'GET',
    url: '/guide/list',
  })
  return res.data
}

// 更新路线排序
export async function updateRouteSortApi(routes: { id: number; sortOrder: number }[]): Promise<void> {
  await api.request({
    method: 'PATCH',
    url: '/guide/route/sort',
    data: { routes },
  })
}

// 获取路线信息
export async function getRouteApi(routeId: string): Promise<{ id: string; name: string; finished: boolean } | null> {
  const res = await api.request({
    method: 'GET',
    url: `/guide/route/${routeId}`,
  })
  return res.data
}

// 获取路线的结局列表
export async function getEndingsApi(routeId: string): Promise<GuideEndingWithProgress[]> {
  const res = await api.request({
    method: 'GET',
    url: `/guide/route/${routeId}/endings`,
  })
  return res.data
}

// 获取结局信息
export async function getEndingApi(endingId: string): Promise<{ id: string; name: string; type: string; finished: boolean; requirements?: string; cover?: string } | null> {
  const res = await api.request({
    method: 'GET',
    url: `/guide/ending/${endingId}`,
  })
  return res.data
}

// 获取结局的步骤列表
export async function getStepsApi(endingId: string): Promise<GuideStepWithProgress[]> {
  const res = await api.request({
    method: 'GET',
    url: `/guide/ending/${endingId}/steps`,
  })
  return res.data
}

// 获取步骤信息
export async function getStepApi(stepId: string): Promise<{ id: string; type: string; content: string; group?: string; prefix?: string; subfix?: string; finished: boolean } | null> {
  const res = await api.request({
    method: 'GET',
    url: `/guide/step/${stepId}`,
  })
  return res.data
}

// 更新路线
export async function updateRouteApi(routeId: string, data: { name: string }): Promise<void> {
  await api.request({
    method: 'PATCH',
    url: `/guide/route/${routeId}`,
    data,
  })
}

// 更新结局
export async function updateEndingApi(endingId: string, data: { name: string; type?: string; requirements?: string; cover?: string }): Promise<void> {
  await api.request({
    method: 'PATCH',
    url: `/guide/ending/${endingId}`,
    data,
  })
}

// 更新步骤
export async function updateStepApi(stepId: string, data: { type?: string; content: string; group?: string; prefix?: string; subfix?: string }): Promise<void> {
  await api.request({
    method: 'PATCH',
    url: `/guide/step/${stepId}`,
    data,
  })
}

// 更新攻略
export async function updateGuideApi(gameId: number, data: { name?: string; level?: number; tips?: string[] }): Promise<void> {
  await api.request({
    method: 'PATCH',
    url: `/guide/${gameId}`,
    data,
  })
}

// 获取游戏角色列表
export async function getGameCharactersApi(gameId: number): Promise<{ id: string; name: string; original: string; imageUrl: string }[]> {
  const res = await api.request({
    method: 'GET',
    url: '/db/vndb/characters',
    params: { gameId },
  })
  return res.data?.items || []
}
