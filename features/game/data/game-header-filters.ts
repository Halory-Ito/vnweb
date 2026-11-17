import type { GameFilterState } from '@/types'

export const GAME_HEADER_DATE_FILTERS = [
  { key: 'releaseDateFrom', label: '发售日期起' },
  { key: 'releaseDateTo', label: '发售日期止' },
] as const

export const GAME_HEADER_SELECT_FILTERS = [
  { key: 'developer', label: '开发商', optionsKey: 'developers' },
  { key: 'publisher', label: '发行商', optionsKey: 'publishers' },
  { key: 'category', label: '类别', optionsKey: 'categories' },
  { key: 'platform', label: '平台', optionsKey: 'platforms' },
  { key: 'tags', label: '标签', optionsKey: 'tags' },
  { key: 'originalPainter', label: '原画', optionsKey: 'originalPainters' },
  { key: 'script', label: '脚本', optionsKey: 'scripts' },
  { key: 'music', label: '音乐', optionsKey: 'musics' },
  { key: 'engine', label: '引擎', optionsKey: 'engines' },
  { key: 'planning', label: '企划', optionsKey: 'plannings' },
] as const satisfies readonly { key: keyof GameFilterState; label: string; optionsKey: string }[]
