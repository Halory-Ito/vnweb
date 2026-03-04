import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import { BGMClient, SGDBClient } from '@/lib/vndb-client'
import { mapBGMSubjectToGameInfo } from '@/lib/vndb-utils'

import type { GameInfo } from '@/types/game-types'

type IncomingMetadata = GameInfo & {
  icon?: string
  logo?: string
  bg?: string
}

type MetadataProvider = 'bangumi' | 'steamgriddb'
type MergeStrategy = 'replace' | 'merge' | 'append'

type UpdatableField =
  | 'date'
  | 'cover'
  | 'icon'
  | 'logo'
  | 'bg'
  | 'summary'
  | 'name'
  | 'nameCn'
  | 'tags'
  | 'nsfw'
  | 'ailases'
  | 'platforms'
  | 'gameType'
  | 'gameEngine'
  | 'music'
  | 'script'
  | 'graphic'
  | 'originalPainter'
  | 'animationProduction'
  | 'developer'
  | 'publisher'
  | 'programmer'

type Payload = {
  gameIds?: number[]
  provider?: MetadataProvider
  query?: string
  fields?: UpdatableField[]
  strategy?: MergeStrategy
}

type BGMSubject = {
  id?: number
}

type BGMSearchResponse = {
  data?: BGMSubject[]
}

type SGDBGame = {
  id?: number
  name?: string
  release_date?: number
}

type SGDBImage = {
  url?: string | URL
}

const pickFirstImageUrl = (images: unknown[]) => {
  const first = images[0] as { url?: string | URL } | undefined
  const raw = first?.url
  return typeof raw === 'string' ? raw : raw?.toString() || ''
}

const parseCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const uniqueList = (items: string[]) => {
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of items) {
    const normalized = item.trim()
    if (!normalized) {
      continue
    }
    if (seen.has(normalized)) {
      continue
    }
    seen.add(normalized)
    result.push(normalized)
  }
  return result
}

const toGameInfoSnapshot = (row: {
  date: string
  cover: string
  icon: string
  logo: string
  bg: string
  summary: string
  name: string
  nameCn: string
  tags: string
  nsfw: number
  ailases: string
  platforms: string
  gameType: string
  gameEngine: string
  music: string
  script: string
  graphic: string
  originalPainter: string
  animationProduction: string
  developer: string
  publisher: string
  programmer: string
}) => {
  return {
    date: row.date,
    cover: row.cover,
    icon: row.icon,
    logo: row.logo,
    bg: row.bg,
    summary: row.summary,
    name: row.name,
    nameCn: row.nameCn,
    tags: parseCsv(row.tags),
    nsfw: row.nsfw === 1,
    ailases: parseCsv(row.ailases),
    platforms: parseCsv(row.platforms),
    gameType: row.gameType,
    gameEngine: row.gameEngine,
    music: row.music,
    script: row.script,
    graphic: row.graphic,
    originalPainter: row.originalPainter,
    animationProduction: row.animationProduction,
    developer: row.developer,
    publisher: row.publisher,
    programmer: row.programmer,
  }
}

const toSGDBGameInfo = (
  game?: SGDBGame,
  grids: SGDBImage[] = [],
  icons: SGDBImage[] = [],
  logos: SGDBImage[] = [],
  heroes: SGDBImage[] = [],
): IncomingMetadata => {
  const cover = pickFirstImageUrl(grids)
  const releaseDate =
    typeof game?.release_date === 'number' && game.release_date > 0
      ? new Date(game.release_date * 1000).toISOString().slice(0, 10)
      : ''

  return {
    date: releaseDate,
    cover,
    icon: pickFirstImageUrl(icons),
    logo: pickFirstImageUrl(logos),
    bg: pickFirstImageUrl(heroes),
    summary: '',
    name: game?.name ?? '',
    nameCn: game?.name ?? '',
    tags: [],
    nsfw: false,
    ailases: [],
    platforms: [],
    gameType: '',
    gameEngine: '',
    websites: [],
    links: [],
    music: '',
    script: '',
    graphic: '',
    originalPainter: '',
    animationProduction: '',
    developer: '',
    publisher: '',
    programmer: '',
  }
}

const searchByProvider = async (
  provider: MetadataProvider,
  keyword: string,
) => {
  if (provider === 'bangumi') {
    const response = await BGMClient.request({
      method: 'POST',
      url: '/v0/search/subjects',
      data: {
        keyword,
        filter: {
          type: [4],
        },
      },
      params: {
        offset: 0,
        limit: 1,
      },
    })

    const payload = response.data as BGMSearchResponse
    return payload.data?.[0]?.id ? String(payload.data[0].id) : null
  }

  const games = await SGDBClient.searchGame(keyword)
  const first = games[0] as { id?: number } | undefined
  return first?.id ? String(first.id) : null
}

const fetchByProvider = async (provider: MetadataProvider, id: string) => {
  if (provider === 'bangumi') {
    const response = await BGMClient.request({
      method: 'GET',
      url: `/v0/subjects/${id}`,
    })
    const info = mapBGMSubjectToGameInfo(
      response.data as never,
    ) as IncomingMetadata
    return {
      ...info,
      icon: info.icon || '',
      logo: info.logo || '',
      bg: info.bg || '',
    }
  }

  const gameId = Number(id)
  const game = (await SGDBClient.getGameById(gameId)) as SGDBGame
  const grids = (await SGDBClient.getGridsById(
    gameId,
  )) as unknown as SGDBImage[]
  const icons = (await SGDBClient.getIconsById(
    gameId,
  )) as unknown as SGDBImage[]
  const logos = (await SGDBClient.getLogosById(
    gameId,
  )) as unknown as SGDBImage[]
  const heroes = (await SGDBClient.getHeroesById(
    gameId,
  )) as unknown as SGDBImage[]
  return toSGDBGameInfo(game, grids, icons, logos, heroes)
}

const resolveMatchedId = async (provider: MetadataProvider, query: string) => {
  const trimmed = query.trim()
  if (!trimmed) {
    return null
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed
  }

  return searchByProvider(provider, trimmed)
}

const mergeTextField = (
  field: UpdatableField,
  currentValue: string,
  incomingValue: string,
  strategy: MergeStrategy,
) => {
  const current = (currentValue || '').trim()
  const incoming = (incomingValue || '').trim()

  if (strategy === 'replace') {
    return incoming
  }

  if (strategy === 'merge') {
    return current || incoming
  }

  if (!incoming) {
    return current
  }
  if (!current) {
    return incoming
  }
  if (current.includes(incoming)) {
    return current
  }

  const separator = field === 'summary' ? '\n\n' : ' / '
  return `${current}${separator}${incoming}`
}

const mergeListField = (
  current: string[],
  incoming: string[],
  strategy: MergeStrategy,
) => {
  if (strategy === 'replace') {
    return uniqueList(incoming)
  }

  if (strategy === 'merge') {
    return uniqueList([...current, ...incoming])
  }

  return uniqueList([...current, ...incoming])
}

const mergeBoolField = (
  current: boolean,
  incoming: boolean,
  strategy: MergeStrategy,
) => {
  if (strategy === 'replace') {
    return incoming
  }

  return current || incoming
}

const updateBatchMetadata = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as Payload
    const gameIds = Array.isArray(body.gameIds)
      ? body.gameIds.filter(
          (id): id is number => Number.isInteger(id) && id > 0,
        )
      : []

    const provider = body.provider
    const strategy = body.strategy
    const customQuery = String(body.query || '').trim()
    const fields = Array.isArray(body.fields)
      ? body.fields.filter((field): field is UpdatableField =>
          [
            'date',
            'cover',
            'icon',
            'logo',
            'bg',
            'summary',
            'name',
            'nameCn',
            'tags',
            'nsfw',
            'ailases',
            'platforms',
            'gameType',
            'gameEngine',
            'music',
            'script',
            'graphic',
            'originalPainter',
            'animationProduction',
            'developer',
            'publisher',
            'programmer',
          ].includes(field),
        )
      : []

    if (!provider || !['bangumi', 'steamgriddb'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    if (!strategy || !['replace', 'merge', 'append'].includes(strategy)) {
      return NextResponse.json({ error: 'Invalid strategy' }, { status: 400 })
    }

    if (gameIds.length === 0) {
      return NextResponse.json({ error: 'No game ids' }, { status: 400 })
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields selected' }, { status: 400 })
    }

    let updatedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (const gameId of gameIds) {
      try {
        const rows = await db
          .select({
            id: GameInfoTable.id,
            date: GameInfoTable.date,
            cover: GameInfoTable.cover,
            icon: GameInfoTable.icon,
            logo: GameInfoTable.logo,
            bg: GameInfoTable.bg,
            summary: GameInfoTable.summary,
            name: GameInfoTable.name,
            nameCn: GameInfoTable.nameCn,
            tags: GameInfoTable.tags,
            nsfw: GameInfoTable.nsfw,
            ailases: GameInfoTable.ailases,
            platforms: GameInfoTable.platforms,
            gameType: GameInfoTable.gameType,
            gameEngine: GameInfoTable.gameEngine,
            music: GameInfoTable.music,
            script: GameInfoTable.script,
            graphic: GameInfoTable.graphic,
            originalPainter: GameInfoTable.originalPainter,
            animationProduction: GameInfoTable.animationProduction,
            developer: GameInfoTable.developer,
            publisher: GameInfoTable.publisher,
            programmer: GameInfoTable.programmer,
          })
          .from(GameInfoTable)
          .where(eq(GameInfoTable.id, gameId))
          .limit(1)

        const currentRow = rows[0]
        if (!currentRow) {
          skippedCount += 1
          continue
        }

        const fallbackKeyword = (
          currentRow.nameCn ||
          currentRow.name ||
          ''
        ).trim()
        const effectiveQuery = customQuery || fallbackKeyword
        if (!effectiveQuery) {
          skippedCount += 1
          continue
        }

        const matchedId = await resolveMatchedId(provider, effectiveQuery)
        if (!matchedId) {
          skippedCount += 1
          continue
        }

        const incoming = await fetchByProvider(provider, matchedId)
        const current = toGameInfoSnapshot(currentRow)

        const patch: Partial<{
          date: string
          cover: string
          icon: string
          logo: string
          bg: string
          summary: string
          name: string
          nameCn: string
          tags: string
          nsfw: number
          ailases: string
          platforms: string
          gameType: string
          gameEngine: string
          music: string
          script: string
          graphic: string
          originalPainter: string
          animationProduction: string
          developer: string
          publisher: string
          programmer: string
          updatedAt: string
        }> = {
          updatedAt: new Date().toISOString(),
        }

        for (const field of fields) {
          switch (field) {
            case 'date':
            case 'cover':
            case 'icon':
            case 'logo':
            case 'bg':
            case 'summary':
            case 'name':
            case 'nameCn':
            case 'gameType':
            case 'gameEngine':
            case 'music':
            case 'script':
            case 'graphic':
            case 'originalPainter':
            case 'animationProduction':
            case 'developer':
            case 'publisher':
            case 'programmer': {
              const nextValue = mergeTextField(
                field,
                String(current[field] || ''),
                String(incoming[field] || ''),
                strategy,
              )

              if (field === 'date') patch.date = nextValue
              if (field === 'cover') patch.cover = nextValue
              if (field === 'icon') patch.icon = nextValue
              if (field === 'logo') patch.logo = nextValue
              if (field === 'bg') patch.bg = nextValue
              if (field === 'summary') patch.summary = nextValue
              if (field === 'name') patch.name = nextValue
              if (field === 'nameCn') patch.nameCn = nextValue
              if (field === 'gameType') patch.gameType = nextValue
              if (field === 'gameEngine') patch.gameEngine = nextValue
              if (field === 'music') patch.music = nextValue
              if (field === 'script') patch.script = nextValue
              if (field === 'graphic') patch.graphic = nextValue
              if (field === 'originalPainter') patch.originalPainter = nextValue
              if (field === 'animationProduction') {
                patch.animationProduction = nextValue
              }
              if (field === 'developer') patch.developer = nextValue
              if (field === 'publisher') patch.publisher = nextValue
              if (field === 'programmer') patch.programmer = nextValue
              break
            }
            case 'tags': {
              patch.tags = mergeListField(
                current.tags,
                incoming.tags,
                strategy,
              ).join(',')
              break
            }
            case 'ailases': {
              patch.ailases = mergeListField(
                current.ailases,
                incoming.ailases,
                strategy,
              ).join(',')
              break
            }
            case 'platforms': {
              patch.platforms = mergeListField(
                current.platforms,
                incoming.platforms,
                strategy,
              ).join(',')
              break
            }
            case 'nsfw': {
              const nextBool = mergeBoolField(
                Boolean(current.nsfw),
                Boolean(incoming.nsfw),
                strategy,
              )
              patch.nsfw = nextBool ? 1 : 0
              break
            }
          }
        }

        await db
          .update(GameInfoTable)
          .set(patch)
          .where(eq(GameInfoTable.id, gameId))
        updatedCount += 1
      } catch {
        failedCount += 1
      }
    }

    return NextResponse.json({
      data: {
        updatedCount,
        skippedCount,
        failedCount,
      },
    })
  } catch (error) {
    console.error('Batch metadata update failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Batch metadata update failed' },
      { status: 500 },
    )
  }
}

export { updateBatchMetadata as POST }
