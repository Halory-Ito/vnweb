export type PlayTimeRecordFormItem = {
  id: string
  startAt: string
  endAt: string
}

export type PlayTimeDurationUnit = 'seconds' | 'minutes' | 'hours'

export const PLAY_TIME_DURATION_UNITS: readonly {
  value: PlayTimeDurationUnit
  label: string
  fullLabel: string
  seconds: number
}[] = [
  { value: 'seconds', label: '秒', fullLabel: '秒', seconds: 1 },
  { value: 'minutes', label: '分', fullLabel: '分钟', seconds: 60 },
  { value: 'hours', label: '时', fullLabel: '小时', seconds: 3600 },
]

export const HOUR_OPTIONS: readonly string[] = Array.from({ length: 24 }, (_, index) =>
  String(index).padStart(2, '0'),
)

export const MINUTE_OPTIONS: readonly string[] = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, '0'),
)

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds))
  const hour = Math.floor(safe / 3600)
  const minute = Math.floor((safe % 3600) / 60)
  const second = safe % 60
  return `${hour.toString().padStart(2, '0')}:${minute
    .toString()
    .padStart(2, '0')}:${second.toString().padStart(2, '0')}`
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '-'
  }
  return date.toLocaleString('zh-CN')
}

/** Formats a local Date into a `YYYY-MM-DD` date input string. */
export function formatDateInput(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Formats a local Date into an `HH:mm` time input string. */
export function formatTimeInput(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Parses a `YYYY-MM-DD` string into a local Date, rejecting invalid calendar dates. */
export function parseDateInput(dateValue: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue)
  if (!match) {
    return undefined
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined
  }
  return date
}

/** Parses an `HH:mm` string into validated zero-padded hour and minute parts. */
export function parseTimeParts(timeValue: string): { hour: string; minute: string } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(timeValue)
  if (!match) {
    return null
  }

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null
  }
  return { hour: match[1], minute: match[2] }
}

/** Formats separate date and time input strings for trigger display. */
export function formatDateTimeDisplay(dateValue: string, timeValue: string): string {
  if (!parseDateInput(dateValue)) {
    return ''
  }
  return parseTimeParts(timeValue) ? `${dateValue} ${timeValue}` : `${dateValue} --:--`
}

export function toDateInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return formatDateInput(date)
}

export function toTimeInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return formatTimeInput(date)
}

export function fromDateTimeInput(dateValue: string, timeValue: string): string {
  if (!dateValue || !timeValue) {
    return ''
  }
  const date = new Date(`${dateValue}T${timeValue}`)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toISOString()
}

export function calcDurationSeconds(startAt: string, endAt: string): number {
  const start = new Date(startAt)
  const end = new Date(endAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
}

function getSafeTimestamp(value: string): number {
  const ts = Date.parse(value)
  return Number.isFinite(ts) ? ts : Number.NEGATIVE_INFINITY
}

export function sortPlayTimeRecordsDesc(
  records: PlayTimeRecordFormItem[],
): PlayTimeRecordFormItem[] {
  return [...records].sort((a, b) => {
    const endDiff = getSafeTimestamp(b.endAt) - getSafeTimestamp(a.endAt)
    if (endDiff !== 0) return endDiff
    const startDiff = getSafeTimestamp(b.startAt) - getSafeTimestamp(a.startAt)
    if (startDiff !== 0) return startDiff
    return b.id.localeCompare(a.id, undefined, { numeric: true })
  })
}

/** Parses a positive duration input string with its unit into seconds. */
export function parseDurationThresholdSeconds(
  value: string,
  unit: PlayTimeDurationUnit,
): number | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  const unitConfig = PLAY_TIME_DURATION_UNITS.find((item) => item.value === unit)
  if (!unitConfig) {
    return null
  }
  return parsed * unitConfig.seconds
}

/** Formats a positive duration threshold and unit for confirmation display. */
export function formatDurationThresholdLabel(value: string, unit: PlayTimeDurationUnit): string {
  if (parseDurationThresholdSeconds(value, unit) === null) {
    return ''
  }
  const unitConfig = PLAY_TIME_DURATION_UNITS.find((item) => item.value === unit)
  if (!unitConfig) {
    return ''
  }
  return `${Number(value.trim())} ${unitConfig.fullLabel}`
}

/** Counts records whose duration is strictly lower than `thresholdSeconds`. */
export function countRecordsBelowDuration(
  records: readonly PlayTimeRecordFormItem[],
  thresholdSeconds: number | null,
): number {
  if (thresholdSeconds === null) {
    return 0
  }
  return records.filter((item) => calcDurationSeconds(item.startAt, item.endAt) < thresholdSeconds)
    .length
}

/** Removes records whose duration is strictly lower than `thresholdSeconds`. */
export function removeRecordsBelowDuration(
  records: readonly PlayTimeRecordFormItem[],
  thresholdSeconds: number,
): { remaining: PlayTimeRecordFormItem[]; removedCount: number } {
  const remaining = records.filter(
    (item) => calcDurationSeconds(item.startAt, item.endAt) >= thresholdSeconds,
  )
  return {
    remaining,
    removedCount: records.length - remaining.length,
  }
}
