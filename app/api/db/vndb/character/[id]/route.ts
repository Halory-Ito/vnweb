import { NextRequest, NextResponse } from 'next/server'

import { VNDBClient } from '@/lib/vndb-client'

type VndbCharacterDetailResult = {
  id?: string
  name?: string
  original?: string | null
  description?: string | null
  blood_type?: string | null
  height?: number | null
  weight?: number | null
  bust?: number | null
  waist?: number | null
  hips?: number | null
  cup?: string | null
  age?: number | null
  birthday?: [number, number] | null
  sex?: [string | null, string | null] | null
  gender?: [string | null, string | null] | null
  image?: {
    url?: string
  } | null
}

const normalizeCharacterId = (rawId: string) => {
  const trimmed = rawId.trim()
  if (!trimmed) {
    return ''
  }

  if (/^c\d+$/i.test(trimmed)) {
    return `c${trimmed.slice(1)}`
  }

  if (/^\d+$/.test(trimmed)) {
    return `c${trimmed}`
  }

  return ''
}

const getCharacterById = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await context.params
    const characterId = normalizeCharacterId(id)

    if (!characterId) {
      return NextResponse.json(
        { error: 'Invalid character id parameter' },
        { status: 400 },
      )
    }

    const res = await VNDBClient.request({
      method: 'POST',
      url: '/character',
      data: {
        filters: ['id', '=', characterId],
        fields:
          'name, original, description, image.url, blood_type, height, weight, bust, waist, hips, cup, age, birthday, sex, gender',
        results: 1,
      },
    })

    const payload = res.data as {
      results?: VndbCharacterDetailResult[]
    }

    const item = payload.results?.[0]
    if (!item) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({
      data: {
        id: item.id ?? characterId,
        name: item.name ?? '',
        original: item.original ?? '',
        description: item.description ?? '',
        imageUrl: item.image?.url ?? '',
        bloodType: item.blood_type ?? '',
        height: item.height ?? null,
        weight: item.weight ?? null,
        bust: item.bust ?? null,
        waist: item.waist ?? null,
        hips: item.hips ?? null,
        cup: item.cup ?? '',
        age: item.age ?? null,
        birthday: item.birthday ?? null,
        sex: item.sex ?? null,
        gender: item.gender ?? null,
      },
    })
  } catch (error) {
    console.error('VNDB character detail fetch failed:', error)
    return NextResponse.json(
      {
        error: (error as Error).message || 'VNDB character detail fetch failed',
      },
      { status: 500 },
    )
  }
}

export const GET = getCharacterById
