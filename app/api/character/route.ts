import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { CharacterTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export async function GET(request: NextRequest) {
  try {
    const gameIdParam = request.nextUrl.searchParams.get('gameId')
    const gameId = Number(gameIdParam)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: 'Invalid game id' }, { status: 400 })
    }

    const characters = await db
      .select({
        id: CharacterTable.id,
        gameId: CharacterTable.gameId,
        vndbId: CharacterTable.vndbId,
        name: CharacterTable.name,
        original: CharacterTable.original,
        description: CharacterTable.description,
        imageUrl: CharacterTable.imageUrl,
        bloodType: CharacterTable.bloodType,
        height: CharacterTable.height,
        weight: CharacterTable.weight,
        bust: CharacterTable.bust,
        waist: CharacterTable.waist,
        hips: CharacterTable.hips,
        age: CharacterTable.age,
        birthdayMonth: CharacterTable.birthdayMonth,
        birthdayDay: CharacterTable.birthdayDay,
        sex: CharacterTable.sex,
        gender: CharacterTable.gender,
      })
      .from(CharacterTable)
      .where(eq(CharacterTable.gameId, gameId))
      .orderBy(CharacterTable.vndbId)

    return NextResponse.json(characters)
  } catch (error) {
    console.error('Fetch characters error:', error)
    return NextResponse.json({ error: 'Failed to fetch characters' }, { status: 500 })
  }
}
