import { api } from '@/lib/request-utils'

import type { GameSearchItem, GameSearchResult, ThirdPartyLibraryGameItem } from './types'
import type { GameInfo } from '@/types/game'

type BGMInfoboxItem = {
  key: string
  value: string | Array<{ k?: string; v: string }>
}

type BGMSubject = {
  id?: number
  date?: string
  images?: {
    large?: string
  }
  summary?: string
  name?: string
  name_cn?: string
  tags?: Array<{
    name?: string
  }>
  nsfw?: boolean
  infobox?: BGMInfoboxItem[]
}

type BGMSearchResponse = {
  total?: number
  limit?: number
  offset?: number
  data?: BGMSubject[]
}

const toInfoboxTextList = (value: BGMInfoboxItem['value'] | undefined): string[] => {
  if (!value) {
    return []
  }
  if (typeof value === 'string') {
    return value ? [value] : []
  }
  return value.map((item) => item.v).filter(Boolean)
}

const toInfoboxRecordList = (
  value: BGMInfoboxItem['value'] | undefined,
): Record<string, string>[] => {
  if (!value) {
    return []
  }
  if (typeof value === 'string') {
    return []
  }
  return value
    .map((item) => {
      if (!item.v) {
        return null
      }
      return {
        [item.k ?? 'default']: item.v,
      }
    })
    .filter((item): item is Record<string, string> => item !== null)
}

const getInfoboxItem = (infobox: BGMInfoboxItem[] | undefined, keys: string[]) => {
  if (!infobox?.length) {
    return undefined
  }
  return infobox.find((item) => keys.includes(item.key))
}

const getInfoboxValueText = (infobox: BGMInfoboxItem[] | undefined, keys: string[]) => {
  const item = getInfoboxItem(infobox, keys)
  return toInfoboxTextList(item?.value)[0] ?? ''
}

export const mapBGMSubjectToGameInfo = (subject: BGMSubject): GameInfo => {
  const infobox = subject.infobox ?? []

  const aliases = toInfoboxTextList(getInfoboxItem(infobox, ['别名'])?.value)

  const platforms = [
    ...toInfoboxTextList(getInfoboxItem(infobox, ['平台'])?.value),
    ...infobox
      .map((item) => (item.key.startsWith('平台:') ? item.key.replace('平台:', '') : ''))
      .filter(Boolean),
  ]

  return {
    date: subject.date ?? '',
    cover: subject.images?.large ?? '',
    summary: subject.summary ?? '',
    name: subject.name ?? '',
    nameCn: subject.name_cn ?? '',
    tags: (subject.tags ?? []).map((tag) => tag.name ?? '').filter(Boolean),
    nsfw: subject.nsfw ?? false,
    ailases: Array.from(new Set(aliases)),
    platforms: Array.from(new Set(platforms)),
    gameType: getInfoboxValueText(infobox, ['游戏类型']),
    gameEngine: getInfoboxValueText(infobox, ['游戏引擎']),
    websites: toInfoboxRecordList(getInfoboxItem(infobox, ['website'])?.value),
    links: toInfoboxRecordList(getInfoboxItem(infobox, ['链接'])?.value),
    music: getInfoboxValueText(infobox, ['音乐']),
    script: getInfoboxValueText(infobox, ['script', '剧本']),
    graphic: getInfoboxValueText(infobox, ['graphic']),
    originalPainter: getInfoboxValueText(infobox, ['原画']),
    animationProduction: getInfoboxValueText(infobox, ['动画制作']),
    developer: getInfoboxValueText(infobox, ['开发']),
    publisher: getInfoboxValueText(infobox, ['发行']),
    programmer: getInfoboxValueText(infobox, ['程序']),
  }
}

/** BGM API Functions */
export const searchBGMSubjectsApi = async (
  keyword: string,
  offset: number = 0,
  limit: number = 10,
) => {
  const res = await api.request({
    method: 'POST',
    url: `/db/bgm?offset=${offset}&limit=${limit}`,
    data: {
      keyword,
      filter: {
        type: [4],
        // nsfw: true,
      },
    },
  })

  const payload = res.data as BGMSearchResponse
  const subjects = payload.data ?? []

  return {
    total: payload.total ?? subjects.length,
    items: subjects
      .map((subject) => {
        if (subject.id === undefined || subject.id === null) {
          return null
        }

        const developer = getInfoboxValueText(subject.infobox, ['开发', '开发商'])

        return {
          id: String(subject.id),
          name: subject.name_cn || subject.name || '',
          developer,
          date: subject.date ?? '',
        }
      })
      .filter((item): item is GameSearchItem => item !== null),
  } satisfies GameSearchResult
}

export const getBGMSubjectByIdApi = async (id: string) => {
  const res = await api.request({
    method: 'GET',
    url: '/db/bgm',
    params: {
      id,
    },
  })
  return res.data
}

export const getBGMGameInfoByIdApi = async (id: string) => {
  const rawSubject = (await getBGMSubjectByIdApi(id)) as BGMSubject
  return mapBGMSubjectToGameInfo(rawSubject)
}

export const searchBangumiCollectedGamesApi = async () => {
  const res = await api.request({
    method: 'GET',
    url: '/game/bangumi-import/search',
    timeout: 10 * 60 * 1000,
  })

  return res.data as {
    data: {
      total: number
      items: ThirdPartyLibraryGameItem[]
    }
  }
}
