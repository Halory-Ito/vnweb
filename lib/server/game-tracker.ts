import { eq } from 'drizzle-orm'

import { GamePlayTable } from '@/db/schema'
import { finalizeGameSession } from '@/features/game/lib/game-session-utils'
import { db } from '@/lib/drizzle'
import {
  doesProcessSnapshotMatchTarget,
  normalizeGameTrackingMode,
  resolveEffectiveTrackingTarget,
} from '@/lib/game-tracking'
import { ensureGameTrackingSchema } from '@/lib/server/game-tracking-schema'
import {
  captureWindowsProcessSnapshot,
  stopWindowsProcessInspector,
} from '@/lib/server/windows-process-inspector'

import type { GameTrackingMode } from '@/types/game'

const POLL_INTERVAL_MS = 2000
const STARTUP_GRACE_MS = 20_000
const EXIT_DEBOUNCE_MISSES = 2

export type AutoStopResult = {
  finalized: boolean
  elapsedSeconds: number
}

export type StartGameTrackerInput = {
  gameId: number
  mode: GameTrackingMode
  target: string
  launchedPid?: number
  startedAtMs?: number
  onAutoStop?: (result: AutoStopResult) => void | Promise<void>
}

type TrackedGameSession = {
  gameId: number
  mode: GameTrackingMode
  target: string
  launchedPid: number
  startedAtMs: number
  hasSeenRunning: boolean
  lastSeenAtMs: number | null
  consecutiveMisses: number
  onAutoStop?: (result: AutoStopResult) => void | Promise<void>
}

type TrackerState = {
  sessions: Map<number, TrackedGameSession>
  timer: NodeJS.Timeout | null
  isPolling: boolean
}

const globalForTracker = globalThis as typeof globalThis & {
  __vnwebGameTrackerState?: TrackerState
}

function getTrackerState(): TrackerState {
  if (!globalForTracker.__vnwebGameTrackerState) {
    globalForTracker.__vnwebGameTrackerState = {
      sessions: new Map<number, TrackedGameSession>(),
      timer: null,
      isPolling: false,
    }
  }
  return globalForTracker.__vnwebGameTrackerState
}

function stopPollTimerIfIdle(state: TrackerState) {
  if (state.sessions.size > 0) {
    return
  }

  if (state.timer) {
    clearInterval(state.timer)
    state.timer = null
  }
  stopWindowsProcessInspector()
}

async function pollTrackedGames() {
  const state = getTrackerState()
  if (state.isPolling || state.sessions.size === 0) {
    return
  }

  state.isPolling = true
  try {
    const snapshot = await captureWindowsProcessSnapshot()
    if (snapshot.length === 0) {
      return
    }

    const now = Date.now()
    const entries = Array.from(state.sessions.entries())

    for (const [gameId, session] of entries) {
      const current = state.sessions.get(gameId)
      if (!current || current !== session) {
        continue
      }

      const matched = doesProcessSnapshotMatchTarget(snapshot, {
        mode: current.mode,
        target: current.target,
        launchedPid: current.launchedPid,
      })

      if (matched) {
        current.hasSeenRunning = true
        current.lastSeenAtMs = now
        current.consecutiveMisses = 0
        continue
      }

      if (!current.hasSeenRunning && now - current.startedAtMs < STARTUP_GRACE_MS) {
        continue
      }

      current.consecutiveMisses += 1
      if (current.consecutiveMisses < EXIT_DEBOUNCE_MISSES) {
        continue
      }

      state.sessions.delete(gameId)
      stopPollTimerIfIdle(state)

      const endedAt = current.lastSeenAtMs ? new Date(current.lastSeenAtMs) : new Date()
      try {
        const result = await finalizeGameSession(gameId, { endedAt })
        await current.onAutoStop?.(result)
      } catch (error) {
        console.error(`[GameTracker] Auto finalize failed for game ${gameId}:`, error)
      }
    }
  } finally {
    state.isPolling = false
  }
}

export function startTrackingGame(input: StartGameTrackerInput): void {
  if (process.platform !== 'win32') {
    return
  }

  const target = input.target.trim()
  if (!Number.isInteger(input.gameId) || input.gameId <= 0 || !target) {
    return
  }

  const state = getTrackerState()
  state.sessions.set(input.gameId, {
    gameId: input.gameId,
    mode: input.mode,
    target,
    launchedPid: input.launchedPid && input.launchedPid > 0 ? input.launchedPid : 0,
    startedAtMs: input.startedAtMs ?? Date.now(),
    hasSeenRunning: false,
    lastSeenAtMs: null,
    consecutiveMisses: 0,
    onAutoStop: input.onAutoStop,
  })

  if (!state.timer) {
    state.timer = setInterval(() => {
      void pollTrackedGames()
    }, POLL_INTERVAL_MS)
  }

  void pollTrackedGames()
}

export function stopTrackingGame(gameId: number): void {
  const state = globalForTracker.__vnwebGameTrackerState
  if (!state) return
  state.sessions.delete(gameId)
  stopPollTimerIfIdle(state)
}

export function stopAllTracking(): void {
  const state = globalForTracker.__vnwebGameTrackerState
  if (!state) return
  state.sessions.clear()
  stopPollTimerIfIdle(state)
}

export async function resumeRunningGameTrackers(): Promise<void> {
  if (process.platform !== 'win32') {
    return
  }

  await ensureGameTrackingSchema()
  const runningRows = await db
    .select({
      gameId: GamePlayTable.gameId,
      exePath: GamePlayTable.exePath,
      pid: GamePlayTable.pid,
      lastLaunchedAt: GamePlayTable.lastLaunchedAt,
      trackingMode: GamePlayTable.trackingMode,
      trackingTarget: GamePlayTable.trackingTarget,
    })
    .from(GamePlayTable)
    .where(eq(GamePlayTable.isRunning, 1))

  for (const row of runningRows) {
    const mode = normalizeGameTrackingMode(row.trackingMode)
    const target = resolveEffectiveTrackingTarget(mode, row.exePath ?? '', row.trackingTarget ?? '')
    if (!target) continue

    const parsedLaunch = row.lastLaunchedAt ? Date.parse(row.lastLaunchedAt) : Number.NaN
    const startedAtMs = Number.isFinite(parsedLaunch)
      ? Math.min(Date.now(), parsedLaunch)
      : Date.now()

    startTrackingGame({
      gameId: row.gameId,
      mode,
      target,
      launchedPid: row.pid ?? 0,
      startedAtMs,
    })
  }
}
