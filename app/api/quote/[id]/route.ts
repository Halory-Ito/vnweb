import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { GameInfoTable, GameQuoteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const parseQuoteId = async (context: { params: Promise<{ id: string }> }) => {
  const { id } = await context.params
  const quoteId = Number(id)

  if (!Number.isInteger(quoteId) || quoteId <= 0) {
    throw new Error('INVALID_QUOTE_ID')
  }

  return quoteId
}

const updateQuote = async (
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const quoteId = await parseQuoteId(context)
    const payload = (await req.json().catch(() => ({}))) as {
      gameId?: number
      content?: string
      characterId?: string
      context?: string
    }

    const gameId = Number(payload.gameId)
    const content = normalizeText(payload.content)
    const characterId = normalizeText(payload.characterId)
    const contextText = normalizeText(payload.context)

    if (!Number.isInteger(gameId) || gameId <= 0) {
      return NextResponse.json({ error: '无效的游戏 id' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json(
        { error: '台词内容不能为空' },
        { status: 400 },
      )
    }

    const game = await db
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)

    if (!game[0]) {
      return NextResponse.json({ error: '游戏不存在' }, { status: 404 })
    }

    const target = await db
      .select({ id: GameQuoteTable.id })
      .from(GameQuoteTable)
      .where(eq(GameQuoteTable.id, quoteId))
      .limit(1)

    if (!target[0]) {
      return NextResponse.json({ error: '摘录不存在' }, { status: 404 })
    }

    await db
      .update(GameQuoteTable)
      .set({
        gameId,
        content,
        characterId,
        context: contextText,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(GameQuoteTable.id, quoteId))

    return NextResponse.json({
      data: {
        updated: true,
        id: quoteId,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'INVALID_QUOTE_ID') {
      return NextResponse.json({ error: '无效的摘录 id' }, { status: 400 })
    }

    console.error('Update quote failed:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 },
    )
  }
}

const deleteQuote = async (
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) => {
  try {
    const quoteId = await parseQuoteId(context)

    const target = await db
      .select({ id: GameQuoteTable.id })
      .from(GameQuoteTable)
      .where(eq(GameQuoteTable.id, quoteId))
      .limit(1)

    if (!target[0]) {
      return NextResponse.json({ error: '摘录不存在' }, { status: 404 })
    }

    await db.delete(GameQuoteTable).where(eq(GameQuoteTable.id, quoteId))

    return NextResponse.json({
      data: {
        deleted: true,
        id: quoteId,
      },
    })
  } catch (error) {
    if ((error as Error).message === 'INVALID_QUOTE_ID') {
      return NextResponse.json({ error: '无效的摘录 id' }, { status: 400 })
    }

    console.error('Delete quote failed:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 },
    )
  }
}

export { updateQuote as PATCH, deleteQuote as DELETE }
