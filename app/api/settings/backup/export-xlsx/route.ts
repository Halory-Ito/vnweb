import 'dotenv/config'
import dayjs from 'dayjs'
import { and, asc, eq, gt } from 'drizzle-orm'
import ExcelJS from 'exceljs'
import { imageSize } from 'image-size'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs'
import path from 'node:path'

import { GameInfoTable, GameRecordTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export const dynamic = 'force-dynamic'

const formatDateTime = (value: string) => {
  const date = dayjs(value)
  if (!date.isValid()) {
    return value || ''
  }

  return date.format('YYYY-MM-DD HH:mm:ss')
}

const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0))
  const hours = String(Math.floor(safeSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safeSeconds % 3600) / 60)).padStart(2, '0')
  const remainSeconds = String(safeSeconds % 60).padStart(2, '0')

  return `${hours}:${minutes}:${remainSeconds}`
}

const isHttpUrl = (value: string) => /^https?:\/\//i.test(value)

const resolveCoverFilePath = (cover: string) => {
  const raw = (cover || '').trim()
  if (!raw || isHttpUrl(raw) || raw.startsWith('data:')) {
    return ''
  }

  const normalized = raw.replace(/\\/g, '/')
  const publicRelative = normalized.replace(/^\/+/, '')

  const candidates = [
    path.isAbsolute(raw) ? raw : '',
    path.join(process.cwd(), publicRelative),
    path.join(process.cwd(), publicRelative),
    path.join(process.cwd(), normalized),
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  const basename = path.basename(publicRelative)
  if (!basename) {
    return ''
  }

  const fallback = path.join(
    process.cwd(),
    'public',
    'assets',
    'cover',
    basename,
  )
  if (fs.existsSync(fallback)) {
    return fallback
  }

  return ''
}

const pickImageExtension = (filePath: string): 'png' | 'jpeg' | undefined => {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.png') {
    return 'png'
  }
  if (['.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp'].includes(ext)) {
    return 'jpeg'
  }

  return undefined
}

const excelColWidthToPx = (width: number) => Math.floor(width * 7 + 5)
const excelRowHeightToPx = (height: number) => Math.floor(height * (96 / 72))

const COVER_COL_WIDTH = 22
const COVER_ROW_HEIGHT = 72
const COVER_CELL_PADDING_PX = 6

export async function POST(_req: NextRequest) {
  try {
    const rows = await db
      .select({
        gameId: GameRecordTable.gameId,
        recordId: GameRecordTable.id,
        cover: GameInfoTable.cover,
        name: GameInfoTable.name,
        nameCn: GameInfoTable.nameCn,
        playDate: GameRecordTable.playDate,
        playTime: GameRecordTable.playTime,
      })
      .from(GameRecordTable)
      .innerJoin(GameInfoTable, eq(GameRecordTable.gameId, GameInfoTable.id))
      .where(
        and(gt(GameRecordTable.playTime, 0), gt(GameRecordTable.gameId, 0)),
      )
      .orderBy(
        asc(GameRecordTable.gameId),
        asc(GameRecordTable.playDate),
        asc(GameRecordTable.id),
      )

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Timer Records')

    worksheet.columns = [
      { header: '序号', key: 'index', width: 10 },
      { header: '封面', key: 'cover', width: COVER_COL_WIDTH },
      { header: '游戏名称', key: 'nameCn', width: 24 },
      { header: '游戏原名', key: 'name', width: 24 },
      { header: '开始时间', key: 'start', width: 22 },
      { header: '结束时间', key: 'end', width: 22 },
      { header: '本次游戏时长', key: 'duration', width: 16 },
    ]

    worksheet.getRow(1).height = 24
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = {
      vertical: 'middle',
      horizontal: 'center',
    }

    const grouped = new Map<number, typeof rows>()
    for (const item of rows) {
      const list = grouped.get(item.gameId) || []
      list.push(item)
      grouped.set(item.gameId, list)
    }

    let gameIndex = 1
    let currentRow = 2

    for (const [, records] of grouped) {
      if (records.length === 0) {
        continue
      }

      const first = records[0]
      const startRow = currentRow

      for (const record of records) {
        const start = record.playDate || ''
        const startDate = dayjs(start)
        const durationSeconds = record.playTime || 0
        const end = startDate.isValid()
          ? startDate
              .add(durationSeconds, 'second')
              .format('YYYY-MM-DD HH:mm:ss')
          : ''

        const row = worksheet.getRow(currentRow)
        row.values = [
          gameIndex,
          '',
          first.nameCn || first.name || '',
          first.name || '',
          formatDateTime(start),
          end,
          formatDuration(durationSeconds),
        ]
        row.height = COVER_ROW_HEIGHT
        currentRow += 1
      }

      const endRow = currentRow - 1
      if (endRow > startRow) {
        worksheet.mergeCells(`A${startRow}:A${endRow}`)
        worksheet.mergeCells(`B${startRow}:B${endRow}`)
        worksheet.mergeCells(`C${startRow}:C${endRow}`)
        worksheet.mergeCells(`D${startRow}:D${endRow}`)
      }

      const mergedCenterColumns = ['A', 'B', 'C', 'D']
      for (const col of mergedCenterColumns) {
        worksheet.getCell(`${col}${startRow}`).alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        }
      }

      const coverPath = resolveCoverFilePath(first.cover || '')
      const imageExtension = coverPath
        ? pickImageExtension(coverPath)
        : undefined

      if (coverPath && imageExtension) {
        const imageBytes = new Uint8Array(fs.readFileSync(coverPath))
        const size = imageSize(imageBytes)
        const imageId = workbook.addImage({
          filename: coverPath,
          extension: imageExtension,
        })

        const imageWidth = size.width || 0
        const imageHeight = size.height || 0

        if (imageWidth > 0 && imageHeight > 0) {
          const rowsSpan = endRow - startRow + 1
          const containerWidthPx =
            excelColWidthToPx(COVER_COL_WIDTH) - COVER_CELL_PADDING_PX * 2
          const containerHeightPx =
            rowsSpan * excelRowHeightToPx(COVER_ROW_HEIGHT) -
            COVER_CELL_PADDING_PX * 2
          const scale = Math.min(
            containerWidthPx / imageWidth,
            containerHeightPx / imageHeight,
          )
          const renderWidthPx = Math.max(1, Math.floor(imageWidth * scale))
          const renderHeightPx = Math.max(1, Math.floor(imageHeight * scale))

          const offsetXPx = Math.max(
            COVER_CELL_PADDING_PX,
            Math.floor((containerWidthPx - renderWidthPx) / 2) +
              COVER_CELL_PADDING_PX,
          )
          const offsetYPx = Math.max(
            COVER_CELL_PADDING_PX,
            Math.floor((containerHeightPx - renderHeightPx) / 2) +
              COVER_CELL_PADDING_PX,
          )

          const colOffset = offsetXPx / excelColWidthToPx(COVER_COL_WIDTH)
          const rowOffset = offsetYPx / excelRowHeightToPx(COVER_ROW_HEIGHT)

          worksheet.addImage(imageId, {
            tl: {
              col: 1 + colOffset,
              row: startRow - 1 + rowOffset,
            } as any,
            ext: {
              width: renderWidthPx,
              height: renderHeightPx,
            },
            editAs: 'oneCell',
          })
        } else {
          worksheet.addImage(imageId, `B${startRow}:B${endRow}`)
        }
      } else if (coverPath) {
        worksheet.getCell(`B${startRow}`).value = coverPath
      }

      gameIndex += 1
    }

    for (let rowIndex = 2; rowIndex < currentRow; rowIndex += 1) {
      const row = worksheet.getRow(rowIndex)
      row.getCell(5).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      row.getCell(6).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
      row.getCell(7).alignment = {
        vertical: 'middle',
        horizontal: 'center',
      }
    }

    for (let rowIndex = 1; rowIndex < currentRow; rowIndex += 1) {
      for (let colIndex = 1; colIndex <= 7; colIndex += 1) {
        worksheet.getRow(rowIndex).getCell(colIndex).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
      }
    }

    const fileBuffer = await workbook.xlsx.writeBuffer()
    const fileBlob = new Blob([fileBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const timestamp = dayjs().format('YYYY-MM-DD-HH-mm-ss')
    const fileName = `vnweb-timer-records-${timestamp}.xlsx`

    return new NextResponse(fileBlob, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Export xlsx failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || '导出 xlsx 失败' },
      { status: 500 },
    )
  }
}
