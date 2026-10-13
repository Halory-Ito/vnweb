import dayjs from 'dayjs'
import { and, between, eq, inArray, like, or } from 'drizzle-orm'
import ExcelJS from 'exceljs'
import { NextRequest, NextResponse } from 'next/server'

import { CharacterTable, GameInfoTable, GameQuoteTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export const dynamic = 'force-dynamic'

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

const formatDateTime = (value: string | null) => {
  if (!value) {
    return ''
  }

  const date = dayjs(value)
  return date.isValid() ? date.format('YYYY-MM-DD HH:mm:ss') : value
}

/**
 * 导出摘录（quote）为独立的 XLSX 文件。
 * 支持 keyword / dateFrom / dateTo 过滤，逻辑与 `GET /api/quote` 列表一致，但不分页。
 */
export async function GET(req: NextRequest) {
  try {
    const keyword = normalizeText(req.nextUrl.searchParams.get('keyword'))
    const dateFrom = normalizeText(req.nextUrl.searchParams.get('dateFrom'))
    const dateTo = normalizeText(req.nextUrl.searchParams.get('dateTo'))
    const gameIds = normalizeText(req.nextUrl.searchParams.get('gameIds'))
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0)

    const conditions = []

    if (gameIds.length > 0) {
      conditions.push(inArray(GameQuoteTable.gameId, gameIds))
    }

    if (keyword) {
      const keywordPattern = `%${keyword}%`
      conditions.push(
        or(
          like(GameQuoteTable.content, keywordPattern),
          like(GameQuoteTable.context, keywordPattern),
          like(GameInfoTable.name, keywordPattern),
          like(GameInfoTable.nameCn, keywordPattern),
          like(CharacterTable.name, keywordPattern),
        ),
      )
    }

    if (dateFrom && dateTo) {
      conditions.push(between(GameQuoteTable.createdAt, dateFrom, dateTo))
    } else if (dateFrom) {
      conditions.push(like(GameQuoteTable.createdAt, `${dateFrom}%`))
    } else if (dateTo) {
      conditions.push(like(GameQuoteTable.createdAt, `${dateTo}%`))
    }

    const rows = await db
      .select({
        content: GameQuoteTable.content,
        context: GameQuoteTable.context,
        createdAt: GameQuoteTable.createdAt,
        gameName: GameInfoTable.name,
        gameNameCn: GameInfoTable.nameCn,
        characterName: CharacterTable.name,
      })
      .from(GameQuoteTable)
      .innerJoin(GameInfoTable, eq(GameQuoteTable.gameId, GameInfoTable.id))
      .leftJoin(CharacterTable, eq(GameQuoteTable.characterId, CharacterTable.vndbId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(GameQuoteTable.id)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Quotes')

    worksheet.columns = [
      { header: '序号', key: 'index', width: 8 },
      { header: '游戏名称', key: 'gameName', width: 24 },
      { header: '游戏原名', key: 'gameNameOriginal', width: 24 },
      { header: '台词内容', key: 'content', width: 50 },
      { header: '出自角色', key: 'characterName', width: 18 },
      { header: '台词背景', key: 'context', width: 40 },
      { header: '创建时间', key: 'createdAt', width: 22 },
    ]

    worksheet.views = [{ state: 'frozen', ySplit: 1 }]
    worksheet.getRow(1).height = 24
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    rows.forEach((row, index) => {
      const excelRow = worksheet.addRow({
        index: index + 1,
        gameName: row.gameNameCn || row.gameName || '',
        gameNameOriginal: row.gameName || '',
        content: row.content || '',
        characterName: row.characterName || '',
        context: row.context || '',
        createdAt: formatDateTime(row.createdAt),
      })

      excelRow.alignment = { vertical: 'middle', wrapText: true }
      excelRow.getCell('index').alignment = { vertical: 'middle', horizontal: 'center' }
      excelRow.getCell('createdAt').alignment = { vertical: 'middle', horizontal: 'center' }
    })

    const columnCount = worksheet.columns.length
    for (let rowIndex = 1; rowIndex <= rows.length + 1; rowIndex += 1) {
      for (let colIndex = 1; colIndex <= columnCount; colIndex += 1) {
        worksheet.getRow(rowIndex).getCell(colIndex).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      }
    }

    const fileBuffer = await workbook.xlsx.writeBuffer()
    const fileBlob = new Blob([fileBuffer], { type: XLSX_MIME })

    const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
    const fileName = `vnweb-quotes-${timestamp}.xlsx`

    return new NextResponse(fileBlob, {
      headers: {
        'Content-Type': XLSX_MIME,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'X-Export-Count': String(rows.length),
      },
    })
  } catch (error) {
    console.error('Export quotes xlsx failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '导出摘录 xlsx 失败' },
      { status: 500 },
    )
  }
}
