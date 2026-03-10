import axios from 'axios'
import { NextResponse } from 'next/server'

import {
  getBoundThirdPartyAccount,
  getImportedExternalIdSet,
} from '../../third-party-import/_shared'

type BangumiMeResponse = {
  id?: number
  username?: string
}

type BangumiCollectionSubject = {
  id?: number
  name?: string
  name_cn?: string
  date?: string
  images?: {
    large?: string
    common?: string
    medium?: string
  }
}

type BangumiCollectionItem = {
  subject_id?: number
  type?: number
  rate?: number
  updated_at?: string
  subject?: BangumiCollectionSubject
}

type BangumiCollectionResponse =
  | BangumiCollectionItem[]
  | {
      data?: BangumiCollectionItem[]
      total?: number
      limit?: number
      offset?: number
    }

const USER_AGENT = 'vnweb/1.0'
const PAGE_SIZE = 50
const MAX_ITEMS = 500

const getCurrentBangumiUsername = async (accessToken: string) => {
  const response = await axios.get<BangumiMeResponse>(
    'https://api.bgm.tv/v0/me',
    {
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': USER_AGENT,
      },
    },
  )

  const username = (response.data.username || '').trim()
  if (!username) {
    throw new Error('无法获取 Bangumi 用户名')
  }

  return username
}

const normalizeCollections = (payload: BangumiCollectionResponse) => {
  if (Array.isArray(payload)) {
    return payload
  }

  return payload.data ?? []
}

const fetchBangumiCollections = async (
  username: string,
  accessToken: string,
) => {
  const items: BangumiCollectionItem[] = []

  for (let offset = 0; offset < MAX_ITEMS; offset += PAGE_SIZE) {
    const response = await axios.get<BangumiCollectionResponse>(
      `https://api.bgm.tv/v0/users/${encodeURIComponent(username)}/collections`,
      {
        timeout: 10_000,
        params: {
          subject_type: 4,
          limit: PAGE_SIZE,
          offset,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': USER_AGENT,
        },
      },
    )

    const pageItems = normalizeCollections(response.data)
    if (pageItems.length === 0) {
      break
    }

    items.push(...pageItems)

    if (pageItems.length < PAGE_SIZE) {
      break
    }
  }

  return items
}

const searchBangumiCollectedGames = async () => {
  try {
    const account = await getBoundThirdPartyAccount('bangumi')
    if (!account?.accessToken) {
      return NextResponse.json(
        { error: '请先绑定 Bangumi 账号' },
        { status: 400 },
      )
    }

    const username = await getCurrentBangumiUsername(account.accessToken)
    const collections = await fetchBangumiCollections(
      username,
      account.accessToken,
    )
    const importedIdSet = await getImportedExternalIdSet('bangumi')

    const items = collections
      .map((item) => {
        const subjectId = item.subject?.id ?? item.subject_id ?? null

        if (!subjectId) {
          return null
        }

        const id = String(subjectId)
        const subject = item.subject ?? {}

        return {
          id,
          name:
            subject.name_cn?.trim() ||
            subject.name?.trim() ||
            `Bangumi Subject ${id}`,
          date: subject.date?.trim() || '',
          coverUrl:
            subject.images?.large?.trim() ||
            subject.images?.common?.trim() ||
            subject.images?.medium?.trim() ||
            '',
          note: item.updated_at?.trim() || '',
          alreadyImported: importedIdSet.has(id),
        }
      })
      .filter(
        (
          item,
        ): item is {
          id: string
          name: string
          date: string
          coverUrl: string
          note: string
          alreadyImported: boolean
        } => item !== null,
      )

    return NextResponse.json({
      data: {
        total: items.length,
        items,
      },
    })
  } catch (error) {
    console.error('Search Bangumi collections failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Bangumi 收藏读取失败' },
      { status: 500 },
    )
  }
}

export { searchBangumiCollectedGames as GET }
