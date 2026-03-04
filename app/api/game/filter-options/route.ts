import { NextResponse } from 'next/server'

import { GameInfoTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

const uniqueSorted = (items: string[]) =>
  Array.from(new Set(items.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'zh-CN'),
  )

const getFilterOptions = async () => {
  try {
    const rows = await db
      .select({
        date: GameInfoTable.date,
        developer: GameInfoTable.developer,
        publisher: GameInfoTable.publisher,
        category: GameInfoTable.gameType,
        platform: GameInfoTable.platforms,
        tags: GameInfoTable.tags,
        originalPainter: GameInfoTable.originalPainter,
        script: GameInfoTable.script,
        music: GameInfoTable.music,
        engine: GameInfoTable.gameEngine,
        planning: GameInfoTable.programmer,
      })
      .from(GameInfoTable)

    const releaseDates = uniqueSorted(
      rows.map((row) => row.date).filter(Boolean),
    )
    const developers = uniqueSorted(rows.map((row) => row.developer))
    const publishers = uniqueSorted(rows.map((row) => row.publisher))
    const categories = uniqueSorted(rows.map((row) => row.category))
    const platforms = uniqueSorted(
      rows.flatMap((row) => splitCsv(row.platform)),
    )
    const tags = uniqueSorted(rows.flatMap((row) => splitCsv(row.tags)))
    const originalPainters = uniqueSorted(
      rows.map((row) => row.originalPainter),
    )
    const scripts = uniqueSorted(rows.map((row) => row.script))
    const musics = uniqueSorted(rows.map((row) => row.music))
    const engines = uniqueSorted(rows.map((row) => row.engine))
    const plannings = uniqueSorted(rows.map((row) => row.planning))

    return NextResponse.json({
      data: {
        releaseDates,
        developers,
        publishers,
        categories,
        platforms,
        tags,
        originalPainters,
        scripts,
        musics,
        engines,
        plannings,
      },
    })
  } catch (error) {
    console.error('Get game filter options failed:', error)
    return NextResponse.json(
      { error: 'Failed to get filter options' },
      { status: 500 },
    )
  }
}

export { getFilterOptions as GET }
