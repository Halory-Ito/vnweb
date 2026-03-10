import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { CharacterTable, GameIdMapTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { syncVndbCharactersByGameId } from '@/lib/server/vndb-character-sync'
import { VNDBClient } from '@/lib/vndb-client'

type VndbCharacterResult = {
  id?: string
  name?: string
  original?: string | null
  vns?: Array<{
    id?: string
    role?: string
  }>
  image?: {
    url?: string
  } | null
}

const ROLE_PRIORITY: Record<string, number> = {
  main: 0,
  primary: 1,
  side: 2,
  appears: 3,
}

const normalizeRole = (value: string | undefined) => {
  if (!value) {
    return ''
  }
  const normalized = value.trim().toLowerCase()
  return ROLE_PRIORITY[normalized] !== undefined ? normalized : ''
}

const getRoleOrder = (role: string) => {
  if (!role) {
    return 99
  }
  return ROLE_PRIORITY[role] ?? 99
}

const normalizeVnId = (rawId: string) => {
  const trimmed = rawId.trim()
  if (!trimmed) {
    return ''
  }
  if (/^v\d+$/i.test(trimmed)) {
    return `v${trimmed.slice(1)}`
  }
  if (/^\d+$/.test(trimmed)) {
    return `v${trimmed}`
  }
  return ''
}

const resolveVnIdByGameId = async (gameId: number) => {
  const idMaps = await db
    .select({
      provider: GameIdMapTable.provider,
      externalId: GameIdMapTable.externalId,
    })
    .from(GameIdMapTable)
    .where(eq(GameIdMapTable.gameId, gameId))

  const vndbBinding = idMaps.find(
    (item) => item.provider.trim().toLowerCase() === 'vndb',
  )

  if (!vndbBinding) {
    return ''
  }

  return normalizeVnId(vndbBinding.externalId)
}

const getCharactersByGameId = async (req: NextRequest) => {
  try {
    const gameIdParam = req.nextUrl.searchParams.get('gameId')
    const gameId = Number(gameIdParam)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const vnId = await resolveVnIdByGameId(gameId)
    if (!vnId) {
      return NextResponse.json({
        data: {
          vnId: '',
          items: [],
        },
      })
    }

    const cachedRows = await db
      .select({
        id: CharacterTable.vndbId,
        name: CharacterTable.name,
        original: CharacterTable.original,
        imageUrl: CharacterTable.imageUrl,
      })
      .from(CharacterTable)
      .where(eq(CharacterTable.gameId, gameId))
      .orderBy(CharacterTable.vndbId)

    if (cachedRows.length > 0) {
      const items = cachedRows.map((item) => ({
        id: item.id,
        name: item.name,
        original: item.original || '',
        imageUrl: item.imageUrl || '',
        role: '',
      }))

      return NextResponse.json({
        data: {
          vnId,
          items,
          source: 'database',
        },
      })
    }

    const res = await VNDBClient.request({
      method: 'POST',
      url: '/character',
      data: {
        filters: ['vn', '=', ['id', '=', vnId]],
        fields: 'name, original, image.url, vns{id,role}',
        sort: 'name',
        results: 100,
      },
    })

    const payload = res.data as {
      results?: VndbCharacterResult[]
    }

    const items = (payload.results ?? [])
      .map((item) => {
        const candidateRoles = (item.vns ?? [])
          .filter((vn) => normalizeVnId(vn.id ?? '') === vnId)
          .map((vn) => normalizeRole(vn.role))
          .filter(Boolean)

        const fallbackRoles = (item.vns ?? [])
          .map((vn) => normalizeRole(vn.role))
          .filter(Boolean)

        const allRoles = candidateRoles.length ? candidateRoles : fallbackRoles
        const role =
          allRoles.sort((a, b) => getRoleOrder(a) - getRoleOrder(b))[0] || ''

        return {
          id: item.id ?? '',
          name: item.name ?? '',
          original: item.original ?? '',
          imageUrl: item.image?.url ?? '',
          role,
          roleOrder: getRoleOrder(role),
        }
      })
      .filter((item) => item.id && (item.name || item.original))
      .sort((a, b) => {
        if (a.roleOrder !== b.roleOrder) {
          return a.roleOrder - b.roleOrder
        }

        const nameA = (a.name || a.original || a.id).toLocaleLowerCase()
        const nameB = (b.name || b.original || b.id).toLocaleLowerCase()
        return nameA.localeCompare(nameB, 'zh-Hans-CN')
      })
      .map((item) => ({
        id: item.id,
        name: item.name,
        original: item.original,
        imageUrl: item.imageUrl,
        role: item.role,
      }))

    return NextResponse.json({
      data: {
        vnId,
        items,
        source: 'vndb',
      },
    })
  } catch (error) {
    console.error('VNDB characters fetch failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'VNDB characters fetch failed' },
      { status: 500 },
    )
  }
}

const syncCharactersToDb = async (req: NextRequest) => {
  try {
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
    }
    const gameId = Number(payload.gameId)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const result = await syncVndbCharactersByGameId(gameId)
    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('VNDB characters sync failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'VNDB characters sync failed' },
      { status: 500 },
    )
  }
}

export const GET = getCharactersByGameId
export const POST = syncCharactersToDb
