import axios from 'axios'
import { NextResponse } from 'next/server'

import {
  getBoundThirdPartyAccount,
  getImportedExternalIdSet,
} from '../../third-party-import/_shared'
import { YMGAL_BASE_URL } from '@/app/config'

const YMGAL_MEDIA_BASE = 'https://store.ymgal.games/'

const YMGAL_API_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Access-Yuemoon-Origin': 'pc',
  Origin: 'https://f.ymgal.games',
  Referer: 'https://f.ymgal.games/',
}

type YMGalVoteItem = {
  gid: number
  gameName: string
  gameChineseName?: string
  mainImg?: string
  score?: number
  comment?: string
  voteTime?: string
  voteType: number
  hide?: boolean
}

type YMGalVotesResponse = {
  success: boolean
  code: number
  data?: {
    result: YMGalVoteItem[]
    total: number
    hasNext: boolean
    pageNum: number
    pageSize: number
  }
}

const PAGE_SIZE = 50
const MAX_ITEMS = 500

const fetchYmgalUserVotes = async (
  userId: string,
  voteType: number,
): Promise<YMGalVoteItem[]> => {
  const items: YMGalVoteItem[] = []

  for (
    let pageNum = 1;
    pageNum <= Math.ceil(MAX_ITEMS / PAGE_SIZE);
    pageNum += 1
  ) {
    const response = await axios.get<YMGalVotesResponse>(
      `${YMGAL_BASE_URL}/api/user/votes/${userId}`,
      {
        timeout: 10_000,
        params: {
          page: pageNum,
          sort: 'time',
          voteType,
        },
        headers: YMGAL_API_HEADERS,
      },
    )

    if (response.data.success === false) {
      break
    }

    const pageItems = response.data.data?.result ?? []
    if (pageItems.length === 0) {
      break
    }

    items.push(...pageItems)

    if (!response.data.data?.hasNext) {
      break
    }
  }

  return items
}

const searchYmgalUserGames = async () => {
  try {
    const account = await getBoundThirdPartyAccount('ymgal')
    if (!account?.accountId) {
      return NextResponse.json(
        { error: '请先绑定 YMGal 账号' },
        { status: 400 },
      )
    }

    // 同时获取想玩（voteType=1）和玩过（voteType=2）的游戏
    const [wantToPlay, played] = await Promise.all([
      fetchYmgalUserVotes(account.accountId, 1),
      fetchYmgalUserVotes(account.accountId, 2),
    ])

    // 合并去重，已导入的以 played 为准（含评分信息）
    const gameMap = new Map<number, YMGalVoteItem>()
    for (const item of wantToPlay) {
      gameMap.set(item.gid, item)
    }
    for (const item of played) {
      gameMap.set(item.gid, item)
    }

    const allGames = Array.from(gameMap.values())
    const importedIdSet = await getImportedExternalIdSet('ymgal')

    const items = allGames
      .filter((item) => !item.hide)
      .map((item) => {
        const id = String(item.gid)
        const name =
          item.gameChineseName?.trim() ||
          item.gameName?.trim() ||
          `YMGal Game ${id}`
        const coverUrl = item.mainImg?.trim()
          ? `${YMGAL_MEDIA_BASE}${item.mainImg.trim()}`
          : ''

        const noteParts: string[] = []
        if (item.voteType === 2) {
          noteParts.push('已玩过')
        } else {
          noteParts.push('想玩')
        }
        if (item.score && item.score > 0) {
          noteParts.push(`评分: ${item.score}`)
        }
        if (item.comment?.trim()) {
          noteParts.push(item.comment.trim())
        }

        return {
          id,
          name,
          date: item.voteTime?.trim() || '',
          coverUrl,
          note: noteParts.join(' | '),
          alreadyImported: importedIdSet.has(id),
        }
      })

    return NextResponse.json({
      data: {
        total: items.length,
        items,
      },
    })
  } catch (error) {
    console.error('Search YMGal user games failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'YMGal 游戏列表读取失败' },
      { status: 500 },
    )
  }
}

export { searchYmgalUserGames as GET }
