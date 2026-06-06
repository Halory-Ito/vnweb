import { Command } from 'commander'
import { desc, eq, like, or, sql } from 'drizzle-orm'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

import {
  CollectionGameTable,
  CollectionTable,
  GameInfoTable,
  GamePlayTable,
} from '../db/schema'
import { db } from '../lib/drizzle'
import { finalizeGameSession } from '../lib/game/game-session-utils'

type GameRow = {
  id: number
  name: string
  nameCn: string
  exePath: string
  isRunning: number
  totalPlayTime: number
  lastLaunchedAt: string
}

const normalizeWindowsPathInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  const withBackslash = trimmed.replace(/\//g, '\\')
  return path.win32.normalize(withBackslash)
}

const formatDuration = (seconds: number) => {
  const value = Math.max(0, Math.floor(seconds))
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = value % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s,
  ).padStart(2, '0')}`
}

const formatDateOnly = (value: string) => {
  if (!value) {
    return '无'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '无'
  }

  return date.toISOString().slice(0, 10)
}

const renderGameTable = (rows: GameRow[], title?: string) => {
  if (rows.length === 0) {
    console.log('暂无游戏')
    return
  }

  if (title) {
    console.log(`\n${title}`)
  }

  const data = rows.map((item) => ({
    id: item.id,
    title: item.nameCn || item.name,
    running: (item.isRunning ?? 0) === 1 ? '是' : '否',
    total: formatDuration(item.totalPlayTime ?? 0),
    lastRun: formatDateOnly(item.lastLaunchedAt),
  }))

  console.table(data)
}

const renderPaginatedGameTable = (
  rows: GameRow[],
  page: number,
  pageSize: number,
  title?: string,
) => {
  if (rows.length === 0) {
    console.log('暂无游戏')
    return
  }

  const totalPages = Math.ceil(rows.length / pageSize)
  const safePage = Math.max(1, Math.min(page, totalPages))
  const start = (safePage - 1) * pageSize
  const pageRows = rows.slice(start, start + pageSize)

  const pageLabel = `${title ?? '游戏列表'} (${safePage}/${totalPages}，共 ${rows.length} 条)`
  renderGameTable(pageRows, pageLabel)
}

const getGames = async (keyword?: string) => {
  const text = (keyword ?? '').trim()
  const whereClause = text
    ? or(
        like(GameInfoTable.name, `%${text}%`),
        like(GameInfoTable.nameCn, `%${text}%`),
      )
    : undefined

  const query = db
    .select({
      id: GameInfoTable.id,
      name: GameInfoTable.name,
      nameCn: GameInfoTable.nameCn,
      exePath: GamePlayTable.exePath,
      isRunning: GamePlayTable.isRunning,
      totalPlayTime: GamePlayTable.totalPlayTime,
      lastLaunchedAt: GamePlayTable.lastLaunchedAt,
    })
    .from(GameInfoTable)
    .leftJoin(GamePlayTable, eq(GameInfoTable.id, GamePlayTable.gameId))

  const rows = whereClause
    ? await query
        .where(whereClause)
        .orderBy(
          desc(sql`coalesce(${GamePlayTable.lastLaunchedAt}, '')`),
          desc(sql`coalesce(${GamePlayTable.totalPlayTime}, 0)`),
          desc(GameInfoTable.id),
        )
    : await query.orderBy(
        desc(sql`coalesce(${GamePlayTable.lastLaunchedAt}, '')`),
        desc(sql`coalesce(${GamePlayTable.totalPlayTime}, 0)`),
        desc(GameInfoTable.id),
      )

  return rows.map((item) => ({
    id: item.id,
    name: item.name,
    nameCn: item.nameCn,
    exePath: item.exePath ?? '',
    isRunning: item.isRunning ?? 0,
    totalPlayTime: item.totalPlayTime ?? 0,
    lastLaunchedAt: item.lastLaunchedAt ?? '',
  }))
}

const listGames = async (page: number, pageSize: number) => {
  const rows = await getGames()
  renderPaginatedGameTable(rows, page, pageSize, '所有游戏')
}

const listCollections = async () => {
  const rows = await db
    .select({ id: CollectionTable.id, name: CollectionTable.name })
    .from(CollectionTable)
    .orderBy(desc(CollectionTable.id))

  if (rows.length === 0) {
    console.log('暂无收藏夹')
    return
  }

  console.table(rows)
}

const searchGames = async (
  keyword: string,
  page: number,
  pageSize: number,
) => {
  const text = keyword.trim()
  if (!text) {
    console.log('请提供关键字，例如: vnweb search 白色相簿')
    return
  }

  const rows = await getGames(text)
  renderPaginatedGameTable(rows, page, pageSize, `搜索: ${text}`)
}

const openCollection = async (
  collectionInput: string,
  page: number,
  pageSize: number,
) => {
  const input = collectionInput.trim()
  if (!input) {
    console.log('请提供收藏夹名称，例如: vnweb open 我的收藏')
    return
  }

  const collectionId = Number(input)
  const byId = Number.isInteger(collectionId) && collectionId > 0

  const collections = await db
    .select({ id: CollectionTable.id, name: CollectionTable.name })
    .from(CollectionTable)
    .where(
      byId
        ? eq(CollectionTable.id, collectionId)
        : eq(CollectionTable.name, input),
    )
    .limit(1)

  const collection = collections[0]
  if (!collection) {
    console.log(`未找到收藏夹: ${input}`)
    return
  }

  const rows = await db
    .select({
      id: GameInfoTable.id,
      name: GameInfoTable.name,
      nameCn: GameInfoTable.nameCn,
      exePath: GamePlayTable.exePath,
      isRunning: GamePlayTable.isRunning,
      totalPlayTime: GamePlayTable.totalPlayTime,
      lastLaunchedAt: GamePlayTable.lastLaunchedAt,
    })
    .from(CollectionGameTable)
    .innerJoin(GameInfoTable, eq(CollectionGameTable.gameId, GameInfoTable.id))
    .leftJoin(GamePlayTable, eq(GameInfoTable.id, GamePlayTable.gameId))
    .where(eq(CollectionGameTable.collectionId, collection.id))
    .orderBy(
      desc(sql`coalesce(${GamePlayTable.lastLaunchedAt}, '')`),
      desc(sql`coalesce(${GamePlayTable.totalPlayTime}, 0)`),
      desc(GameInfoTable.id),
    )

  renderPaginatedGameTable(
    rows.map((item) => ({
      id: item.id,
      name: item.name,
      nameCn: item.nameCn,
      exePath: item.exePath ?? '',
      isRunning: item.isRunning ?? 0,
      totalPlayTime: item.totalPlayTime ?? 0,
      lastLaunchedAt: item.lastLaunchedAt ?? '',
    })),
    page,
    pageSize,
    `收藏夹: ${collection.name}`,
  )
}

const startGame = async (gameIdText?: string) => {
  const rows = await db
    .select({
      id: GameInfoTable.id,
      name: GameInfoTable.name,
      nameCn: GameInfoTable.nameCn,
      exePath: GamePlayTable.exePath,
      playId: GamePlayTable.id,
      isRunning: GamePlayTable.isRunning,
      lastLaunchedAt: GamePlayTable.lastLaunchedAt,
    })
    .from(GameInfoTable)
    .leftJoin(GamePlayTable, eq(GameInfoTable.id, GamePlayTable.gameId))

  if (gameIdText) {
    const gameId = Number(gameIdText)
    if (!Number.isInteger(gameId) || gameId <= 0) {
      console.log('无效的游戏 ID，例如: vnweb start 12')
      return
    }
    const game = rows.find((r) => r.id === gameId)
    if (game) {
      await launchGameRow(game)
    } else {
      console.log('游戏不存在')
    }
    return
  }

  const launchedRows = rows.filter((r) => r.lastLaunchedAt)
  if (launchedRows.length === 0) {
    console.log('没有最近启动过的游戏，请指定游戏 ID。')
    return
  }

  const latestGame = launchedRows.sort(
    (a, b) =>
      new Date(b.lastLaunchedAt!).getTime() -
      new Date(a.lastLaunchedAt!).getTime(),
  )[0]
  console.log(`快速启动最近游戏: ${latestGame.nameCn || latestGame.name}`)
  await launchGameRow(latestGame)
}

const launchGameRow = async (game: {
  id: number
  name: string
  nameCn: string
  exePath: string | null
  playId: number | null
  isRunning: number | null
}) => {
  const gameTitle = game.nameCn || game.name
  const finalExePath = normalizeWindowsPathInput(game.exePath ?? '')
  if (!finalExePath) {
    console.log('该游戏未配置 exe 路径，请先在系统中配置后再启动。')
    return
  }

  if (!path.win32.isAbsolute(finalExePath)) {
    console.log('exe 路径必须是绝对路径。')
    return
  }

  await fs.promises.access(finalExePath, fs.constants.F_OK)

  if ((game.isRunning ?? 0) === 1) {
    console.log(`游戏 ${gameTitle} 已在运行，已附加计时。`)
  } else {
    console.log(`正在启动游戏: ${gameTitle}`)
    const child = spawn(finalExePath, [], {
      cwd: path.dirname(finalExePath),
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
    })
    child.unref()

    const launchedAt = new Date().toISOString()
    if (game.playId) {
      await db
        .update(GamePlayTable)
        .set({
          exePath: finalExePath,
          isRunning: 1,
          lastLaunchedAt: launchedAt,
        })
        .where(eq(GamePlayTable.id, game.playId))
    } else {
      await db.insert(GamePlayTable).values({
        gameId: game.id,
        exePath: finalExePath,
        isRunning: 1,
        lastLaunchedAt: launchedAt,
      })
    }
  }

  console.log('游戏状态: 运行中')
  console.log('按 q 可结束游戏并停止计时')

  let finished = false
  let elapsed = 0
  let accumulatedElapsed = 0
  let tickStartedAt = Date.now()
  let timer: NodeJS.Timeout | null = null

  const startTimer = () => {
    tickStartedAt = Date.now()
    timer = setInterval(() => {
      elapsed =
        accumulatedElapsed + Math.floor((Date.now() - tickStartedAt) / 1000)
      process.stdout.write(`\r本次计时: ${formatDuration(elapsed)}  `)
    }, 1000)
  }

  const pauseTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    elapsed =
      accumulatedElapsed + Math.floor((Date.now() - tickStartedAt) / 1000)
    accumulatedElapsed = elapsed
    process.stdout.write('\n')
  }

  startTimer()

  readline.emitKeypressEvents(process.stdin)
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }

  const cleanup = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    process.stdin.removeListener('keypress', onKeyPress)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }
  }

  const onKeyPress = async (_str: string, key: readline.Key) => {
    if (finished) {
      return
    }

    if (key.ctrl && key.name === 'c') {
      cleanup()
      process.exit(0)
      return
    }

    if (key.name !== 'q') {
      return
    }

    finished = true

    pauseTimer()

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
    }

    try {
      await finalizeGameSession(game.id)
      cleanup()
      process.exit(0)
    } catch (error) {
      cleanup()
      console.error('结束游戏失败:', (error as Error).message)
      process.exit(1)
    }
  }

  process.stdin.on('keypress', onKeyPress)
}

const main = async () => {
  const program = new Command()

  program
    .name('vnweb')
    .description('vnweb 游戏库命令行管理工具')
    .version('1.0.0')

  const listCmd = program
    .command('list')
    .description('列出游戏或收藏夹资源')

  listCmd
    .command('game')
    .alias('g')
    .description('列出所有游戏（支持分页）')
    .option('-p, --page <page>', '页码，默认 1', '1')
    .option('-s, --size <size>', '每页条数，默认 20', '20')
    .action(async (opts: { page: string; size: string }) => {
      await listGames(Number(opts.page), Number(opts.size))
    })

  listCmd
    .command('collection')
    .alias('c')
    .description('列出所有收藏夹')
    .action(async () => {
      await listCollections()
    })

  program
    .command('search')
    .description('根据名称关键字搜索游戏（支持分页）')
    .argument('<keyword...>', '搜索关键字，支持空格分隔')
    .option('-p, --page <page>', '页码，默认 1', '1')
    .option('-s, --size <size>', '每页条数，默认 20', '20')
    .action(
      async (keywordParts: string[], opts: { page: string; size: string }) => {
        await searchGames(keywordParts.join(' '), Number(opts.page), Number(opts.size))
      },
    )

  program
    .command('open')
    .description('列出指定收藏夹中的游戏（支持分页）')
    .argument('<collection_name...>', '收藏夹名称或 ID')
    .option('-p, --page <page>', '页码，默认 1', '1')
    .option('-s, --size <size>', '每页条数，默认 20', '20')
    .action(
      async (
        nameParts: string[],
        opts: { page: string; size: string },
      ) => {
        await openCollection(
          nameParts.join(' '),
          Number(opts.page),
          Number(opts.size),
        )
      },
    )

  program
    .command('start')
    .alias('s')
    .description('启动游戏并进行计时')
    .argument('[game_id]', '游戏 ID，省略则启动最近一次的游戏')
    .action(async (gameId?: string) => {
      await startGame(gameId)
    })

  program.addHelpText(
    'after',
    `
示例:
  vnweb list game                列出所有游戏
  vnweb list g -p 2 -s 10       列出游戏第2页，每页10条
  vnweb list c                   列出所有收藏夹
  vnweb search 白色相簿          搜索游戏
  vnweb search 纯白 -p 1 -s 5   搜索游戏，第1页，每页5条
  vnweb open 我的收藏            列出收藏夹中的游戏
  vnweb start 12                 启动游戏 ID=12
  vnweb start                    启动最近一次的游戏
  vnweb s 12                     同上（简写）
`,
  )

  await program.parseAsync(process.argv)
}

main().catch((error) => {
  console.error('命令执行失败:', (error as Error).message)
  process.exit(1)
})
