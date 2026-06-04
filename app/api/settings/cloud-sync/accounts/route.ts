import axios from 'axios'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { ThirdPartyAccountTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

type Provider = 'steam' | 'bangumi' | 'vndb' | 'ymgal'

type AccountProfile = {
  displayName: string
  secondaryName: string
  avatar: string
  profileUrl: string
}

type SteamPlayerSummary = {
  steamid?: string
  personaname?: string
  profileurl?: string
  avatarfull?: string
  avatarmedium?: string
  realname?: string
}

const PROVIDER_SET = new Set<Provider>(['steam', 'bangumi', 'vndb', 'ymgal'])
const STEAM_PLAYER_SUMMARIES_API =
  'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const normalizeProvider = (value: unknown): Provider | null => {
  const provider = normalizeText(value).toLowerCase()
  if (!provider) {
    return null
  }
  if (!PROVIDER_SET.has(provider as Provider)) {
    return null
  }
  return provider as Provider
}

const normalizeAvatarUrl = (value: unknown) => {
  if (typeof value === 'string') {
    return value.trim()
  }

  if (value && typeof value === 'object') {
    const avatar = value as Record<string, unknown>
    return (
      [avatar.large, avatar.medium, avatar.small]
        .map((item) => normalizeText(item))
        .find(Boolean) || ''
    )
  }

  return ''
}

const getSteamApiKey = () => {
  return (
    process.env.STEAM_API_KEY ||
    process.env.NEXT_PUBLIC_STEAM_API_KEY ||
    process.env.STEAM_WEB_API_KEY ||
    ''
  )
}

const isValidSteamUid = (value: string) => {
  return /^\d{17}$/.test(value)
}

const fetchSteamPlayerSummary = async (steamId: string) => {
  const apiKey = getSteamApiKey()
  if (!apiKey) {
    throw new Error('未配置 STEAM_API_KEY，无法获取 Steam 账号信息')
  }

  const response = await axios.get<{
    response?: {
      players?: SteamPlayerSummary[]
    }
  }>(STEAM_PLAYER_SUMMARIES_API, {
    timeout: 10_000,
    params: {
      key: apiKey,
      steamids: steamId,
    },
  })

  return response.data.response?.players?.[0] || null
}

const validateBangumiToken = async (accessToken: string) => {
  const response = await axios.get('https://api.bgm.tv/v0/me', {
    timeout: 10_000,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'vnweb/1.0',
    },
  })

  const payload = response.data as {
    id?: number
    username?: string
    nickname?: string
  }

  const accountId =
    payload.username?.trim() ||
    payload.nickname?.trim() ||
    (payload.id ? String(payload.id) : '')

  if (!accountId) {
    throw new Error('无法获取 Bangumi 账号信息')
  }

  return {
    accountId,
    expiresAt: '',
  }
}

const validateSteamUid = async (steamUid: string) => {
  const normalizedUid = steamUid.trim()
  if (!isValidSteamUid(normalizedUid)) {
    throw new Error('Steam UID 必须是 17 位数字')
  }

  const player = await fetchSteamPlayerSummary(normalizedUid)
  const accountId = normalizeText(player?.steamid)

  if (!accountId) {
    throw new Error('无法获取 Steam 账号信息')
  }

  return {
    accountId,
    expiresAt: '',
  }
}

const validateVndbToken = async (accessToken: string) => {
  const response = await axios.get('https://api.vndb.org/kana/authinfo', {
    timeout: 10_000,
    headers: {
      Authorization: `Token ${accessToken}`,
    },
  })

  const payload = response.data as {
    id?: string
    username?: string
  }

  const accountId = payload.id?.trim() || payload.username?.trim() || ''
  if (!accountId) {
    throw new Error('无法获取 VNDB 账号信息')
  }

  return {
    accountId,
    expiresAt: '',
  }
}

const validateYmgalUserId = async (userId: string) => {
  const normalizedUid = userId.trim()
  if (!normalizedUid) {
    throw new Error('YMGal 用户 ID 不能为空')
  }

  try {
    const response = await axios.get(
      'https://www.ymgal.games/api/user/space',
      {
        timeout: 10_000,
        params: { uid: normalizedUid },
        headers: YMGAL_API_HEADERS,
      },
    )

    const payload = response.data as {
      success?: boolean
      data?: { uid?: number }
    }

    if (payload.success === false) {
      throw new Error('YMGal 用户不存在')
    }

    const accountId = payload.data?.uid
      ? String(payload.data.uid)
      : normalizedUid

    return {
      accountId,
      expiresAt: '',
    }
  } catch {
    // 如果验证接口不存在或失败，仍然允许绑定
    return {
      accountId: normalizedUid,
      expiresAt: '',
    }
  }
}

const getBangumiProfile = async (
  accountId: string,
  accessToken: string,
): Promise<AccountProfile> => {
  try {
    const response = await axios.get('https://api.bgm.tv/v0/me', {
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'vnweb/1.0',
      },
    })

    const payload = response.data as {
      id?: number
      username?: string
      nickname?: string
      avatar?: unknown
    }

    const username = normalizeText(payload.username)
    const nickname = normalizeText(payload.nickname)
    const id = payload.id ? String(payload.id) : ''

    return {
      displayName: nickname || username || accountId,
      secondaryName: username && username !== nickname ? `@${username}` : id,
      avatar: normalizeAvatarUrl(payload.avatar),
      profileUrl: username
        ? `https://bgm.tv/user/${username}`
        : id
          ? `https://bgm.tv/user/${id}`
          : '',
    }
  } catch {
    return {
      displayName: accountId,
      secondaryName: '',
      avatar: '',
      profileUrl: '',
    }
  }
}

const getSteamProfile = async (accountId: string): Promise<AccountProfile> => {
  try {
    const player = await fetchSteamPlayerSummary(accountId)
    const displayName = normalizeText(player?.personaname) || accountId
    const realName = normalizeText(player?.realname)
    const avatar =
      normalizeText(player?.avatarfull) || normalizeText(player?.avatarmedium)
    const profileUrl =
      normalizeText(player?.profileurl) ||
      `https://steamcommunity.com/profiles/${accountId}`

    return {
      displayName,
      secondaryName: realName,
      avatar,
      profileUrl,
    }
  } catch {
    return {
      displayName: accountId,
      secondaryName: '',
      avatar: '',
      profileUrl: `https://steamcommunity.com/profiles/${accountId}`,
    }
  }
}

const getVndbProfile = async (
  accountId: string,
  accessToken: string,
): Promise<AccountProfile> => {
  try {
    const response = await axios.get('https://api.vndb.org/kana/authinfo', {
      timeout: 10_000,
      headers: {
        Authorization: `Token ${accessToken}`,
      },
    })

    const payload = response.data as {
      id?: string
      username?: string
    }

    const userId = normalizeText(payload.id) || accountId
    const username = normalizeText(payload.username)

    return {
      displayName: username || userId,
      secondaryName: username ? userId : '',
      avatar: '',
      profileUrl: userId ? `https://vndb.org/${userId}` : '',
    }
  } catch {
    return {
      displayName: accountId,
      secondaryName: '',
      avatar: '',
      profileUrl: accountId ? `https://vndb.org/${accountId}` : '',
    }
  }
}

const YMGAL_AVATAR_BASE = 'https://store.ymgal.games/'

const YMGAL_API_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Access-Yuemoon-Origin': 'pc',
  Origin: 'https://f.ymgal.games',
  Referer: 'https://f.ymgal.games/',
}

const getYmgalProfile = async (
  accountId: string,
  _accessToken: string,
): Promise<AccountProfile> => {
  try {
    const response = await axios.get(
      'https://www.ymgal.games/api/user/space',
      {
        timeout: 10_000,
        params: { uid: accountId },
        headers: YMGAL_API_HEADERS,
      },
    )

    const payload = response.data as {
      success?: boolean
      data?: {
        uid?: number
        username?: string
        avatar?: string
      }
    }

    if (payload.success === false) {
      throw new Error('YMGal 用户不存在')
    }

    const data = payload.data ?? {}
    const username = normalizeText(data.username)
    const uid = data.uid ? String(data.uid) : accountId
    const avatarRaw = normalizeText(data.avatar)
    const avatar = avatarRaw
      ? `${YMGAL_AVATAR_BASE}${avatarRaw}`
      : ''

    return {
      displayName: username || accountId,
      secondaryName: uid,
      avatar,
      profileUrl: uid ? `https://www.ymgal.games/user/${uid}` : '',
    }
  } catch {
    return {
      displayName: accountId,
      secondaryName: '',
      avatar: '',
      profileUrl: `https://www.ymgal.games/user/${accountId}`,
    }
  }
}

const PROFILE_TIMEOUT_MS = 3_000

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms),
    ),
  ])

const fallbackProfile = (accountId: string): AccountProfile => ({
  displayName: accountId,
  secondaryName: '',
  avatar: '',
  profileUrl: '',
})

const listAccounts = async () => {
  try {
    const rows = await db
      .select({
        id: ThirdPartyAccountTable.id,
        provider: ThirdPartyAccountTable.provider,
        accountId: ThirdPartyAccountTable.accountId,
        accessToken: ThirdPartyAccountTable.accessToken,
        expiresAt: ThirdPartyAccountTable.expiresAt,
        updatedAt: ThirdPartyAccountTable.updatedAt,
      })
      .from(ThirdPartyAccountTable)

    const items = await Promise.all(
      rows.map(async (row) => {
        const provider = normalizeProvider(row.provider)

        let profile: AccountProfile
        try {
          if (provider === 'bangumi') {
            profile = await withTimeout(
              getBangumiProfile(row.accountId, row.accessToken),
              PROFILE_TIMEOUT_MS,
            )
          } else if (provider === 'steam') {
            profile = await withTimeout(
              getSteamProfile(row.accountId),
              PROFILE_TIMEOUT_MS,
            )
          } else if (provider === 'vndb') {
            profile = await withTimeout(
              getVndbProfile(row.accountId, row.accessToken),
              PROFILE_TIMEOUT_MS,
            )
          } else if (provider === 'ymgal') {
            profile = await withTimeout(
              getYmgalProfile(row.accountId, row.accessToken),
              PROFILE_TIMEOUT_MS,
            )
          } else {
            profile = fallbackProfile(row.accountId)
          }
        } catch {
          profile = fallbackProfile(row.accountId)
        }

        return {
          id: row.id,
          provider: row.provider,
          accountId: row.accountId,
          expiresAt: row.expiresAt,
          updatedAt: row.updatedAt,
          profile,
        }
      }),
    )

    return NextResponse.json({
      data: {
        items,
      },
    })
  } catch (error) {
    console.error('List third party accounts failed:', error)
    return NextResponse.json({ error: '加载第三方账号失败' }, { status: 500 })
  }
}

const loginByToken = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      provider?: string
      accessToken?: string
      accountId?: string
      refreshToken?: string
      expiresAt?: string
    }

    const provider = normalizeProvider(body.provider)
    const accessToken = normalizeText(body.accessToken)
    const accountIdInput = normalizeText(body.accountId)
    const refreshToken = normalizeText(body.refreshToken)
    const expiresAtFromPayload = normalizeText(body.expiresAt)

    if (!provider) {
      return NextResponse.json({ error: 'provider 无效' }, { status: 400 })
    }

    if (provider !== 'steam' && provider !== 'ymgal' && !accessToken) {
      return NextResponse.json(
        { error: 'accessToken 不能为空' },
        { status: 400 },
      )
    }

    const validated =
      provider === 'bangumi'
        ? await validateBangumiToken(accessToken)
        : provider === 'vndb'
          ? await validateVndbToken(accessToken)
          : provider === 'ymgal'
            ? await validateYmgalUserId(accountIdInput || accessToken)
            : await validateSteamUid(accountIdInput || accessToken)

    const now = dayjs().toISOString()
    const expiresAt = expiresAtFromPayload || validated.expiresAt || ''

    await db.transaction(async (tx) => {
      await tx
        .delete(ThirdPartyAccountTable)
        .where(eq(ThirdPartyAccountTable.provider, provider))

      await tx.insert(ThirdPartyAccountTable).values({
        provider,
        accountId: validated.accountId,
        accessToken: provider === 'steam' ? '' : accessToken,
        refreshToken,
        expiresAt,
        createdAt: now,
        updatedAt: now,
      })
    })

    return NextResponse.json({
      data: {
        provider,
        accountId: validated.accountId,
        updatedAt: now,
      },
    })
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      if (status === 401) {
        return NextResponse.json(
          { error: 'Token 无效或已过期' },
          { status: 401 },
        )
      }
    }

    console.error('Token login failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '第三方账号登录失败' },
      { status: 500 },
    )
  }
}

const removeAccount = async (req: NextRequest) => {
  try {
    const provider = normalizeProvider(req.nextUrl.searchParams.get('provider'))
    if (!provider) {
      return NextResponse.json({ error: 'provider 无效' }, { status: 400 })
    }

    await db
      .delete(ThirdPartyAccountTable)
      .where(eq(ThirdPartyAccountTable.provider, provider))

    return NextResponse.json({
      data: {
        deleted: true,
        provider,
      },
    })
  } catch (error) {
    console.error('Delete third party account failed:', error)
    return NextResponse.json({ error: '解绑第三方账号失败' }, { status: 500 })
  }
}

export { listAccounts as GET, loginByToken as POST, removeAccount as DELETE }
