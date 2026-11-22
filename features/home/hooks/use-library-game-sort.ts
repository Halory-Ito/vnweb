import { useMemo, useState } from 'react'

import type { GameCardListItem } from '@/types'

type GameComparator = (a: GameCardListItem, b: GameCardListItem) => number

function sortableDate(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? Number.MIN_SAFE_INTEGER : timestamp
}

const sortFields = {
  name: { label: '名称', compare: (a, b) => a.title.localeCompare(b.title) },
  public_date: {
    label: '发布日期',
    compare: (a, b) => sortableDate(a.publishAt) - sortableDate(b.publishAt),
  },
  last_run: {
    label: '最后运行日期',
    compare: (a, b) => sortableDate(a.lastRunAt) - sortableDate(b.lastRunAt),
  },
  add_date: {
    label: '添加日期',
    compare: (a, b) => sortableDate(a.addedAt) - sortableDate(b.addedAt),
  },
  play_time: { label: '游玩时间', compare: (a, b) => a.playTime - b.playTime },
  rating: { label: '评分', compare: (a, b) => a.rating - b.rating },
} satisfies Record<string, { label: string; compare: GameComparator }>

type SortField = keyof typeof sortFields
type SortOrder = 'asc' | 'desc'

const sortOptions = (Object.keys(sortFields) as SortField[]).map((field) => ({
  field,
  label: sortFields[field].label,
}))

export function useLibraryGameSort<Game extends GameCardListItem>(
  games: Game[],
  initialField: SortField = 'last_run',
  initialOrder: SortOrder = 'desc',
) {
  const [field, setField] = useState(initialField)
  const [order, setOrder] = useState(initialOrder)

  const items = useMemo(() => {
    const { compare } = sortFields[field]
    return [...games].sort(order === 'asc' ? compare : (a, b) => compare(b, a))
  }, [field, games, order])

  const changeField = (value: string) => {
    const option = sortOptions.find(({ field }) => field === value)
    if (option) setField(option.field)
  }

  const toggleOrder = () => setOrder((current) => (current === 'asc' ? 'desc' : 'asc'))

  return { items, field, order, sortOptions, changeField, toggleOrder }
}
