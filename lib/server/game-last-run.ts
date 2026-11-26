export type TimerRecordTimingInput = {
  playDate: string | null
  playTime: number | null
}

export type GameTimerRecordTimingInput = TimerRecordTimingInput & {
  gameId: number
}

export function getTimerRecordEndMs(record: TimerRecordTimingInput): number | null {
  const rawStart = (record.playDate || '').trim()
  if (!rawStart) return null
  const startMs = Date.parse(rawStart)
  if (!Number.isFinite(startMs)) return null
  const durationSeconds = Math.max(0, Number(record.playTime || 0))
  return startMs + durationSeconds * 1000
}

export function getLatestTimerEndAt(records: TimerRecordTimingInput[]): string {
  let maxEndMs: number | null = null
  for (const record of records) {
    const endMs = getTimerRecordEndMs(record)
    if (endMs === null) continue
    if (maxEndMs === null || endMs > maxEndMs) {
      maxEndMs = endMs
    }
  }
  return maxEndMs === null ? '' : new Date(maxEndMs).toISOString()
}

export function buildLatestTimerEndAtMap(
  records: GameTimerRecordTimingInput[],
): Map<number, string> {
  const maxByGameId = new Map<number, number>()
  for (const record of records) {
    const endMs = getTimerRecordEndMs(record)
    if (endMs === null) continue
    const prev = maxByGameId.get(record.gameId)
    if (prev === undefined || endMs > prev) {
      maxByGameId.set(record.gameId, endMs)
    }
  }

  const result = new Map<number, string>()
  for (const [gameId, maxEndMs] of maxByGameId.entries()) {
    result.set(gameId, new Date(maxEndMs).toISOString())
  }
  return result
}
