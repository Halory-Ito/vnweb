import axios from 'axios'
import { NextResponse } from 'next/server'

import {
  getBoundThirdPartyAccount,
  getImportedExternalIdSet,
} from '../../third-party-import/_shared'

type VndbUlistItem = {
  id?: string
  added?: number | null
  lastmod?: number | null
  labels?: Array<{
    id?: number
    label?: string
  }>
  vn?: {
    title?: string
    alttitle?: string | null
    released?: string | null
    image?: {
      url?: string
      thumbnail?: string
    } | null
  } | null
}

type VndbUlistResponse = {
  results?: VndbUlistItem[]
  more?: boolean
  count?: number
}

const PAGE_SIZE = 100
const MAX_ITEMS = 500

const fetchVndbUserList = async (accessToken: string) => {
  const items: VndbUlistItem[] = []

  for (let page = 1; page <= Math.ceil(MAX_ITEMS / PAGE_SIZE); page += 1) {
    const response = await axios.post<VndbUlistResponse>(
      'https://api.vndb.org/kana/ulist',
      {
        fields:
          'id, added, lastmod, labels{id,label}, vn.title, vn.alttitle, vn.released, vn.image{url,thumbnail}',
        sort: 'lastmod',
        reverse: true,
        results: PAGE_SIZE,
        page,
      },
      {
        timeout: 10_000,
        headers: {
          Authorization: `Token ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'vnweb/1.0',
        },
      },
    )

    const pageItems = response.data.results ?? []
    if (pageItems.length === 0) {
      break
    }

    items.push(...pageItems)

    if (!response.data.more) {
      break
    }
  }

  return items
}

const searchVndbUserList = async () => {
  try {
    const account = await getBoundThirdPartyAccount('vndb')
    if (!account?.accessToken) {
      return NextResponse.json({ error: '请先绑定 VNDB 账号' }, { status: 400 })
    }

    const listItems = await fetchVndbUserList(account.accessToken)
    const importedIdSet = await getImportedExternalIdSet('vndb')

    const items = listItems
      .map((item) => {
        const id = (item.id || '').trim()
        if (!id) {
          return null
        }

        const labels = (item.labels ?? [])
          .map((label) => (label.label || '').trim())
          .filter(Boolean)

        return {
          id,
          name: item.vn?.alttitle?.trim() || item.vn?.title?.trim() || id,
          date: item.vn?.released?.trim() || '',
          coverUrl:
            item.vn?.image?.url?.trim() ||
            item.vn?.image?.thumbnail?.trim() ||
            '',
          note: labels.join(' / '),
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
    console.error('Search VNDB user list failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'VNDB 列表读取失败' },
      { status: 500 },
    )
  }
}

export { searchVndbUserList as GET }
