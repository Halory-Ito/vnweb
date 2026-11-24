export type MemoryMetadataIconKey =
  | 'user'
  | 'users'
  | 'folder'
  | 'map-pin'
  | 'smile'
  | 'laugh'
  | 'frown'
  | 'meh'
  | 'cloud-sun'
  | 'sun'
  | 'moon'
  | 'cloud-rain'
  | 'snowflake'
  | 'wind'
  | 'music'
  | 'headphones'
  | 'disc-3'
  | 'radio'
  | 'bookmark'
  | 'book-open'
  | 'book-marked'
  | 'notebook-pen'
  | 'feather'
  | 'pen-line'
  | 'quote'
  | 'sparkles'
  | 'heart'
  | 'star'
  | 'crown'
  | 'trophy'
  | 'award'
  | 'flame'
  | 'zap'
  | 'wand-sparkles'
  | 'compass'
  | 'flag'
  | 'globe'
  | 'home'
  | 'clock-3'
  | 'calendar'
  | 'hourglass'
  | 'gamepad-2'
  | 'swords'
  | 'shield'
  | 'ghost'
  | 'cat'
  | 'flower-2'
  | 'leaf'
  | 'coffee'
  | 'gift'
  | 'camera'
  | 'image'
  | 'film'
  | 'tv'
  | 'message-circle'
  | 'bell'
  | 'lightbulb'
  | 'tag'
  | 'link'
  | 'code'
  | 'key-round'
  | 'lock'
  | 'eye'
  | 'hash'

export type MemoryMetadataIconOption = {
  value: MemoryMetadataIconKey
  label: string
  keywords: string[]
}

export type MemoryMetadataFieldConfig = {
  key: string
  label: string
  icon: MemoryMetadataIconKey
  placeholder?: string
  enabled: boolean
  builtin?: boolean
}

export type MemoryPlaybackMode = 'inherit' | 'sequence' | 'list-loop' | 'single-loop' | 'shuffle'

export type MemoryPlaybackSettings = {
  autoPlayOnEnter: boolean
  playMode: MemoryPlaybackMode
  interruptCurrentPlayback: boolean
  stopOnLeave: boolean
}

export type MemorySettings = {
  fields: MemoryMetadataFieldConfig[]
  playback: MemoryPlaybackSettings
}

export const MEMORY_METADATA_ICON_OPTIONS: MemoryMetadataIconOption[] = [
  { value: 'user', label: '作者', keywords: ['author', 'user', 'person', '人物', '用户', '角色'] },
  {
    value: 'users',
    label: '群像',
    keywords: ['users', 'group', 'team', 'characters', '团队', '角色'],
  },
  { value: 'folder', label: '分类', keywords: ['folder', 'category', 'group', '文件夹', '目录'] },
  {
    value: 'map-pin',
    label: '地点',
    keywords: ['location', 'place', 'map', 'pin', '位置', '场景'],
  },
  {
    value: 'smile',
    label: '心情',
    keywords: ['mood', 'smile', 'happy', 'emotion', '开心', '微笑'],
  },
  { value: 'laugh', label: '爆笑', keywords: ['laugh', 'funny', 'joy', 'lol', '欢乐', '大笑'] },
  {
    value: 'frown',
    label: '催泪',
    keywords: ['sad', 'frown', 'cry', 'tear', '悲伤', '难过', '刀子'],
  },
  { value: 'meh', label: '平静', keywords: ['meh', 'calm', 'neutral', '日常', '平淡'] },
  { value: 'cloud-sun', label: '天气', keywords: ['weather', 'cloud', 'sun', '多云', '气候'] },
  {
    value: 'sun',
    label: '晴朗',
    keywords: ['sun', 'sunny', 'day', 'bright', '晴天', '阳光', '白天'],
  },
  { value: 'moon', label: '夜晚', keywords: ['moon', 'night', 'sleep', '深夜', '月亮', '夜间'] },
  {
    value: 'cloud-rain',
    label: '雨天',
    keywords: ['rain', 'rainy', 'cloud', '下雨', '小雨', '阴雨'],
  },
  {
    value: 'snowflake',
    label: '雪天',
    keywords: ['snow', 'winter', 'cold', 'ice', '雪', '冬天', '寒冬'],
  },
  { value: 'wind', label: '微风', keywords: ['wind', 'breeze', 'air', '风', '季节'] },
  { value: 'music', label: '配乐', keywords: ['music', 'bgm', 'ost', 'song', '音乐', '歌曲'] },
  {
    value: 'headphones',
    label: '试听',
    keywords: ['headphones', 'audio', 'listen', '耳机', '听歌'],
  },
  { value: 'disc-3', label: '唱片', keywords: ['disc', 'album', 'cd', 'vinyl', '专辑', '原声'] },
  { value: 'radio', label: '电台', keywords: ['radio', 'broadcast', 'podcast', '广播', '音频'] },
  { value: 'bookmark', label: '书签', keywords: ['bookmark', 'save', 'mark', '收藏', '进度'] },
  {
    value: 'book-open',
    label: '路线',
    keywords: ['book', 'route', 'chapter', 'story', '章节', '剧本'],
  },
  { value: 'book-marked', label: '笔记', keywords: ['notebook', 'book', 'diary', '手记', '档案'] },
  {
    value: 'notebook-pen',
    label: '随笔',
    keywords: ['note', 'write', 'journal', 'pen', '记录', '日记'],
  },
  {
    value: 'feather',
    label: '文笔',
    keywords: ['feather', 'writing', 'prose', 'poem', '文字', '文学'],
  },
  { value: 'pen-line', label: '批注', keywords: ['pen', 'edit', 'comment', '感想', '摘录'] },
  {
    value: 'quote',
    label: '台词',
    keywords: ['quote', 'line', 'dialogue', '金句', '名台词', '语录'],
  },
  {
    value: 'sparkles',
    label: '亮点',
    keywords: ['sparkles', 'highlight', 'magic', '闪光', '名场面'],
  },
  {
    value: 'heart',
    label: '喜爱',
    keywords: ['heart', 'love', 'like', 'favorite', '爱心', '心动', '恋爱'],
  },
  {
    value: 'star',
    label: '评分',
    keywords: ['star', 'rating', 'score', 'favorite', '星星', '推荐'],
  },
  { value: 'crown', label: '神作', keywords: ['crown', 'king', 'best', 'top', '皇冠', '最佳'] },
  { value: 'trophy', label: '成就', keywords: ['trophy', 'achievement', 'win', '奖杯', '全成就'] },
  { value: 'award', label: '徽章', keywords: ['award', 'medal', 'honor', '荣誉', '奖项'] },
  { value: 'flame', label: '热血', keywords: ['flame', 'fire', 'hot', 'passion', '燃', '高潮'] },
  {
    value: 'zap',
    label: '震撼',
    keywords: ['zap', 'shock', 'lightning', 'energy', '电击', '反转'],
  },
  { value: 'wand-sparkles', label: '幻想', keywords: ['wand', 'magic', 'fantasy', '魔法', '奇幻'] },
  {
    value: 'compass',
    label: '探索',
    keywords: ['compass', 'explore', 'adventure', '指南针', '冒险'],
  },
  {
    value: 'flag',
    label: '里程碑',
    keywords: ['flag', 'milestone', 'goal', '旗帜', '通关', '结局'],
  },
  {
    value: 'globe',
    label: '世界观',
    keywords: ['globe', 'world', 'earth', 'setting', '世界', '设定'],
  },
  { value: 'home', label: '日常', keywords: ['home', 'house', 'slice of life', '家园', '生活'] },
  { value: 'clock-3', label: '时刻', keywords: ['clock', 'time', 'hour', '时间', '时长'] },
  { value: 'calendar', label: '日期', keywords: ['calendar', 'date', 'day', 'schedule', '纪念日'] },
  {
    value: 'hourglass',
    label: '回忆',
    keywords: ['hourglass', 'memory', 'past', 'time', '沙漏', '时光'],
  },
  {
    value: 'gamepad-2',
    label: '游玩',
    keywords: ['game', 'gamepad', 'play', 'controller', '手柄', '平台'],
  },
  {
    value: 'swords',
    label: '战斗',
    keywords: ['sword', 'battle', 'fight', 'action', '对决', '冲突'],
  },
  { value: 'shield', label: '守护', keywords: ['shield', 'protect', 'defense', '防卫', '保护'] },
  {
    value: 'ghost',
    label: '悬疑',
    keywords: ['ghost', 'mystery', 'horror', '灵异', '恐怖', '猎奇'],
  },
  { value: 'cat', label: '萌宠', keywords: ['cat', 'pet', 'cute', 'neko', '猫', '可爱'] },
  {
    value: 'flower-2',
    label: '花语',
    keywords: ['flower', 'blossom', 'sakura', '花', '樱花', '恋爱'],
  },
  {
    value: 'leaf',
    label: '季节',
    keywords: ['leaf', 'season', 'autumn', 'spring', '树叶', '自然'],
  },
  {
    value: 'coffee',
    label: '闲暇',
    keywords: ['coffee', 'tea', 'relax', 'cafe', '咖啡', '下午茶'],
  },
  { value: 'gift', label: '纪念', keywords: ['gift', 'present', 'special', '礼物', '特典'] },
  {
    value: 'camera',
    label: '截图',
    keywords: ['camera', 'photo', 'snapshot', 'cg', '相机', '摄影'],
  },
  { value: 'image', label: 'CG', keywords: ['image', 'picture', 'art', 'gallery', '插画', '画面'] },
  { value: 'film', label: '演出', keywords: ['film', 'movie', 'cinema', 'scene', '电影', '分镜'] },
  { value: 'tv', label: '番剧', keywords: ['tv', 'screen', 'anime', 'show', '电视', '动画'] },
  { value: 'message-circle', label: '对白', keywords: ['message', 'chat', 'talk', '气泡', '互动'] },
  { value: 'bell', label: '提醒', keywords: ['bell', 'notice', 'alert', '铃铛', '提示'] },
  {
    value: 'lightbulb',
    label: '灵感',
    keywords: ['lightbulb', 'idea', 'insight', '思考', '伏笔', '解析'],
  },
  { value: 'tag', label: '标签', keywords: ['tag', 'label', 'keyword', '分类', '词条'] },
  { value: 'link', label: '关联', keywords: ['link', 'url', 'reference', '链接', '出处'] },
  { value: 'code', label: '技术', keywords: ['code', 'dev', 'script', '代码', '引擎'] },
  {
    value: 'key-round',
    label: '关键',
    keywords: ['key', 'clue', 'unlock', '钥匙', '线索', '真相'],
  },
  { value: 'lock', label: '剧透', keywords: ['lock', 'spoiler', 'secret', '锁定', '隐藏'] },
  { value: 'eye', label: '视角', keywords: ['eye', 'view', 'pov', 'perspective', '眼睛', '观察'] },
  {
    value: 'hash',
    label: '通用',
    keywords: ['hash', 'default', 'general', 'other', '井号', '自定义'],
  },
]

export const MEMORY_PLAYBACK_MODE_OPTIONS: Array<{
  value: MemoryPlaybackMode
  label: string
}> = [
  { value: 'inherit', label: '跟随播放器当前模式' },
  { value: 'sequence', label: '顺序播放' },
  { value: 'list-loop', label: '列表循环' },
  { value: 'single-loop', label: '单曲循环' },
  { value: 'shuffle', label: '随机播放' },
]

export const DEFAULT_MEMORY_PLAYBACK_SETTINGS: MemoryPlaybackSettings = {
  autoPlayOnEnter: true,
  playMode: 'inherit',
  interruptCurrentPlayback: true,
  stopOnLeave: false,
}

const VALID_PLAYBACK_MODES = new Set<MemoryPlaybackMode>(
  MEMORY_PLAYBACK_MODE_OPTIONS.map((item) => item.value),
)

const VALID_ICON_KEYS = new Set<MemoryMetadataIconKey>(
  MEMORY_METADATA_ICON_OPTIONS.map((item) => item.value),
)

export const DEFAULT_MEMORY_METADATA_FIELDS: MemoryMetadataFieldConfig[] = [
  {
    key: 'author',
    label: '作者',
    icon: 'user',
    placeholder: '记录者名称',
    enabled: true,
    builtin: true,
  },
  {
    key: 'category',
    label: '分类',
    icon: 'folder',
    placeholder: '如：日常、剧透、感想',
    enabled: true,
    builtin: true,
  },
  {
    key: 'location',
    label: '地点',
    icon: 'map-pin',
    placeholder: '如：重庆、家中',
    enabled: true,
    builtin: true,
  },
  {
    key: 'mood',
    label: '心情',
    icon: 'smile',
    placeholder: '如：感动、爆笑、震撼',
    enabled: true,
    builtin: true,
  },
  {
    key: 'weather',
    label: '天气',
    icon: 'cloud-sun',
    placeholder: '如：晴、小雨、深夜',
    enabled: true,
    builtin: true,
  },
  {
    key: 'bgm',
    label: '配乐',
    icon: 'music',
    placeholder: '当时在听的曲目',
    enabled: true,
    builtin: true,
  },
]

export const RESERVED_MEMORY_METADATA_KEYS = new Set([
  'title',
  '标题',
  'summary',
  'description',
  'excerpt',
  'desc',
  'subtitle',
  '简介',
  '摘要',
  '描述',
  'tags',
  'tag',
  '标签',
  'date',
  'updatedat',
  'createdat',
  '日期',
  'ostsongs',
])

const BUILTIN_BY_KEY = new Map(
  DEFAULT_MEMORY_METADATA_FIELDS.map((field) => [field.key.toLowerCase(), field]),
)

export function isValidMemoryMetadataIcon(value: unknown): value is MemoryMetadataIconKey {
  return typeof value === 'string' && VALID_ICON_KEYS.has(value as MemoryMetadataIconKey)
}

export function sanitizeMemoryMetadataKey(key: string) {
  return key.replace(/[:\r\n]/g, '').trim()
}

export function normalizeMemoryPlaybackSettings(input: unknown): MemoryPlaybackSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_MEMORY_PLAYBACK_SETTINGS }
  }

  const record = input as Partial<MemoryPlaybackSettings>
  return {
    autoPlayOnEnter:
      typeof record.autoPlayOnEnter === 'boolean'
        ? record.autoPlayOnEnter
        : DEFAULT_MEMORY_PLAYBACK_SETTINGS.autoPlayOnEnter,
    playMode:
      typeof record.playMode === 'string' &&
      VALID_PLAYBACK_MODES.has(record.playMode as MemoryPlaybackMode)
        ? (record.playMode as MemoryPlaybackMode)
        : DEFAULT_MEMORY_PLAYBACK_SETTINGS.playMode,
    interruptCurrentPlayback:
      typeof record.interruptCurrentPlayback === 'boolean'
        ? record.interruptCurrentPlayback
        : DEFAULT_MEMORY_PLAYBACK_SETTINGS.interruptCurrentPlayback,
    stopOnLeave:
      typeof record.stopOnLeave === 'boolean'
        ? record.stopOnLeave
        : DEFAULT_MEMORY_PLAYBACK_SETTINGS.stopOnLeave,
  }
}

export function normalizeMemoryMetadataFields(input: unknown): MemoryMetadataFieldConfig[] {
  if (!Array.isArray(input)) {
    return DEFAULT_MEMORY_METADATA_FIELDS.map((field) => ({ ...field }))
  }

  const normalized: MemoryMetadataFieldConfig[] = []
  const seenKeys = new Set<string>()

  for (const rawItem of input) {
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      continue
    }

    const record = rawItem as Partial<MemoryMetadataFieldConfig>
    const key = typeof record.key === 'string' ? sanitizeMemoryMetadataKey(record.key) : ''
    const lowerKey = key.toLowerCase()

    if (!key || RESERVED_MEMORY_METADATA_KEYS.has(lowerKey) || seenKeys.has(lowerKey)) {
      continue
    }

    const builtinDefault = BUILTIN_BY_KEY.get(lowerKey)
    const rawLabel = typeof record.label === 'string' ? record.label.trim() : ''
    const rawPlaceholder = typeof record.placeholder === 'string' ? record.placeholder.trim() : ''
    const icon = isValidMemoryMetadataIcon(record.icon)
      ? record.icon
      : (builtinDefault?.icon ?? 'hash')

    seenKeys.add(lowerKey)

    if (builtinDefault) {
      normalized.push({
        key: builtinDefault.key,
        label: rawLabel || builtinDefault.label,
        icon,
        placeholder: rawPlaceholder || builtinDefault.placeholder,
        enabled: typeof record.enabled === 'boolean' ? record.enabled : builtinDefault.enabled,
        builtin: true,
      })
    } else {
      normalized.push({
        key,
        label: rawLabel || key,
        icon,
        placeholder: rawPlaceholder,
        enabled: typeof record.enabled === 'boolean' ? record.enabled : true,
        builtin: false,
      })
    }
  }

  for (const builtinField of DEFAULT_MEMORY_METADATA_FIELDS) {
    if (!seenKeys.has(builtinField.key.toLowerCase())) {
      normalized.push({ ...builtinField })
    }
  }

  return normalized
}

function findMatchingField(entryKey: string, fields: MemoryMetadataFieldConfig[]) {
  const normalized = entryKey.trim().toLowerCase()
  return fields.find(
    (field) => field.key.toLowerCase() === normalized || field.label.toLowerCase() === normalized,
  )
}

export function resolveMemoryMetadataItems(
  entries: Array<{ key: string; value: string }>,
  fields: MemoryMetadataFieldConfig[],
): Array<{ key: string; label: string; icon: MemoryMetadataIconKey; value: string }> {
  return entries
    .filter((entry) => entry.key.trim() && entry.value.trim())
    .map((entry) => {
      const matched = findMatchingField(entry.key, fields)
      if (matched) {
        return {
          key: matched.key,
          label: matched.label,
          icon: matched.icon,
          value: entry.value.trim(),
        }
      }
      const key = entry.key.trim()
      return {
        key,
        label: key,
        icon: 'hash' as const,
        value: entry.value.trim(),
      }
    })
}

export function splitMemoryMetadataValues(
  entries: Array<{ key: string; value: string }>,
  fields: MemoryMetadataFieldConfig[],
): { values: Record<string, string>; unmatched: Array<{ key: string; value: string }> } {
  const values: Record<string, string> = {}
  const unmatched: Array<{ key: string; value: string }> = []

  for (const entry of entries) {
    const key = entry.key.trim()
    const value = entry.value.trim()
    if (!key || !value) {
      continue
    }

    const matched = findMatchingField(key, fields)
    if (matched && !(matched.key in values)) {
      values[matched.key] = value
    } else {
      unmatched.push({ key, value })
    }
  }

  return { values, unmatched }
}

export function buildMemoryMetadataEntries(
  values: Record<string, string>,
  fields: MemoryMetadataFieldConfig[],
  extraEntries: Array<{ key: string; value: string }>,
): Array<{ key: string; value: string }> {
  const result: Array<{ key: string; value: string }> = []
  const seenKeys = new Set<string>()

  for (const field of fields) {
    const value = (values[field.key] ?? '').trim()
    if (!value) {
      continue
    }
    const lowerKey = field.key.toLowerCase()
    if (seenKeys.has(lowerKey)) {
      continue
    }
    seenKeys.add(lowerKey)
    result.push({ key: field.key, value })
  }

  for (const entry of extraEntries) {
    const key = sanitizeMemoryMetadataKey(entry.key)
    const value = entry.value.trim()
    if (!key || !value) {
      continue
    }
    const lowerKey = key.toLowerCase()
    if (RESERVED_MEMORY_METADATA_KEYS.has(lowerKey) || seenKeys.has(lowerKey)) {
      continue
    }
    seenKeys.add(lowerKey)
    result.push({ key, value })
  }

  return result
}
