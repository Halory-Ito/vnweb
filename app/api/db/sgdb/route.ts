import { NextRequest, NextResponse } from 'next/server'

import { SGDBClient } from '@/lib/vndb-client'

type SGDBSearchBody = {
  keyword?: string
}

const searchGames = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as SGDBSearchBody
    const keyword = (body.keyword || '').trim()

    if (!keyword) {
      return NextResponse.json(
        { error: 'Missing keyword parameter' },
        { status: 400 },
      )
    }

    const games = await SGDBClient.searchGame(keyword)
    return NextResponse.json({
      data: games,
      total: games.length,
    })
  } catch (error) {
    console.error('SGDB search failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'SGDB search failed' },
      { status: 500 },
    )
  }
}

const getGameById = async (req: NextRequest) => {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id || Number.isNaN(Number(id))) {
      return NextResponse.json({ error: 'Invalid id parameter' }, { status: 400 })
    }

    const gameId = Number(id)
    const game = await SGDBClient.getGameById(gameId)
    const grids = await SGDBClient.getGridsById(gameId)

    return NextResponse.json({
      data: {
        game,
        grids,
      },
    })
  } catch (error) {
    console.error('SGDB get game by id failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'SGDB get game by id failed' },
      { status: 500 },
    )
  }
}

export const POST = searchGames
export const GET = getGameById
