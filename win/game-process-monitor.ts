import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

type GameSession = {
  gameId: number
  pid: number
  startedAt: string
}

type PollingOptions = {
  intervalMs?: number
  onProcessExit: (session: GameSession) => Promise<void>
}

const gameSessionMap = new Map<number, GameSession>()
let pollingTimer: NodeJS.Timeout | null = null
let currentPollingIntervalMs = 5000
let processExitHandler: ((session: GameSession) => Promise<void>) | null = null

export const isProcessRunning = (pid: number) => {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false
  }

  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export const stopProcessTree = async (pid: number) => {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false
  }

  try {
    await execFileAsync('taskkill.exe', ['/PID', String(pid), '/T', '/F'])
    return true
  } catch {
    return false
  }
}

export const upsertGameSession = (session: GameSession) => {
  gameSessionMap.set(session.gameId, session)
}

export const getGameSession = (gameId: number) => {
  return gameSessionMap.get(gameId) ?? null
}

export const clearGameSession = (gameId: number) => {
  gameSessionMap.delete(gameId)
}

export const stopGameSessionByGameId = async (gameId: number) => {
  const session = getGameSession(gameId)
  if (!session) {
    return false
  }

  await stopProcessTree(session.pid)
  clearGameSession(gameId)
  return true
}

const runPollingOnce = async () => {
  if (!processExitHandler) {
    return
  }

  const sessions = Array.from(gameSessionMap.values())
  for (const session of sessions) {
    if (isProcessRunning(session.pid)) {
      continue
    }

    clearGameSession(session.gameId)
    await processExitHandler(session)
  }
}

export const startGameSessionPolling = ({
  intervalMs = 5000,
  onProcessExit,
}: PollingOptions) => {
  processExitHandler = onProcessExit

  if (
    pollingTimer &&
    currentPollingIntervalMs === intervalMs &&
    processExitHandler
  ) {
    return
  }

  if (pollingTimer) {
    clearInterval(pollingTimer)
  }

  currentPollingIntervalMs = intervalMs
  pollingTimer = setInterval(() => {
    void runPollingOnce()
  }, intervalMs)
}
