export const BASIC_GAME_METADATA_FIELDS = {
  developer: '开发商',
  publisher: '发行商',
  date: '发售日期',
  gameType: '游戏类型',
  gameEngine: '游戏引擎',
  platforms: '平台',
} as const

export const ADDITIONAL_GAME_METADATA_FIELDS = {
  music: '音乐',
  script: '剧本',
  graphic: '美术',
  originalPainter: '原画',
  animationProduction: '动画制作',
  programmer: '程序',
} as const

const metadataFields = { ...BASIC_GAME_METADATA_FIELDS, ...ADDITIONAL_GAME_METADATA_FIELDS }

export type GameMetadataField = keyof typeof metadataFields

export function isGameMetadataField(value: unknown): value is GameMetadataField {
  return typeof value === 'string' && Object.hasOwn(metadataFields, value)
}
