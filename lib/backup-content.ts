import type {
  BackupContentOptions,
  BackupImageCategoryKey,
  SyncUploadPreviewSummary,
} from '@/types'

export const BACKUP_IMAGE_KEYS: readonly BackupImageCategoryKey[] = [
  'cover',
  'ostCover',
  'background',
  'customBackground',
  'character',
  'cg',
  'icon',
  'logo',
  'brand',
  'memory',
  'other',
]

export const BACKUP_IMAGE_LABELS: Record<BackupImageCategoryKey, string> = {
  cover: '游戏封面',
  ostCover: 'OST 封面',
  background: '游戏背景',
  customBackground: '自定义背景',
  character: '角色立绘',
  cg: '游戏 CG',
  icon: '游戏图标',
  logo: '游戏 Logo',
  brand: '品牌图标',
  memory: '回忆图片',
  other: '其他图片',
}

export const DEFAULT_BACKUP_CONTENT_OPTIONS: BackupContentOptions = {
  gameSaves: true,
  images: {
    cover: true,
    ostCover: true,
    background: true,
    customBackground: true,
    character: true,
    cg: true,
    icon: true,
    logo: true,
    brand: true,
    memory: true,
    other: true,
  },
  video: false,
  audio: false,
  font: false,
}

export function normalizeBackupContentOptions(raw: unknown): BackupContentOptions {
  const input =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const rawImages =
    input.images && typeof input.images === 'object' && !Array.isArray(input.images)
      ? (input.images as Record<string, unknown>)
      : {}

  const images = {} as Record<BackupImageCategoryKey, boolean>
  for (const key of BACKUP_IMAGE_KEYS) {
    images[key] =
      typeof rawImages[key] === 'boolean'
        ? rawImages[key]
        : DEFAULT_BACKUP_CONTENT_OPTIONS.images[key]
  }

  return {
    gameSaves:
      typeof input.gameSaves === 'boolean'
        ? input.gameSaves
        : DEFAULT_BACKUP_CONTENT_OPTIONS.gameSaves,
    images,
    video: typeof input.video === 'boolean' ? input.video : DEFAULT_BACKUP_CONTENT_OPTIONS.video,
    audio: typeof input.audio === 'boolean' ? input.audio : DEFAULT_BACKUP_CONTENT_OPTIONS.audio,
    font: typeof input.font === 'boolean' ? input.font : DEFAULT_BACKUP_CONTENT_OPTIONS.font,
  }
}

export function getImagesSelectionState(
  images: Record<BackupImageCategoryKey, boolean>,
): boolean | 'indeterminate' {
  const selectedCount = countSelectedImageCategories(images)
  if (selectedCount === 0) return false
  if (selectedCount === BACKUP_IMAGE_KEYS.length) return true
  return 'indeterminate'
}

export function countSelectedImageCategories(
  images: Record<BackupImageCategoryKey, boolean>,
): number {
  let count = 0
  for (const key of BACKUP_IMAGE_KEYS) {
    if (images[key]) count += 1
  }
  return count
}

export function setAllImagesSelected(
  options: BackupContentOptions,
  selected: boolean,
): BackupContentOptions {
  const images = {} as Record<BackupImageCategoryKey, boolean>
  for (const key of BACKUP_IMAGE_KEYS) {
    images[key] = selected
  }
  return {
    ...options,
    images,
  }
}

export type SelectedSyncCategorySegment = {
  key: 'database' | 'settings' | 'game-saves' | 'images' | 'video' | 'audio' | 'font'
  label: string
  size: number
  fileCount: number
}

export function computeSelectedSyncSummary(
  summary: SyncUploadPreviewSummary,
  options: BackupContentOptions,
) {
  let blockingReason: string | undefined
  if (!summary.database.available) {
    blockingReason = summary.database.unavailableReason || '数据库文件不存在'
  }

  let gameSaveSize = 0
  let gameSaveFiles = 0
  if (options.gameSaves) {
    if (summary.gameSaves.status === 'available') {
      gameSaveSize = summary.gameSaves.size
      gameSaveFiles = summary.gameSaves.fileCount
    } else if (summary.gameSaves.status === 'missing') {
      blockingReason ??= summary.gameSaves.unavailableReason || '存档目录不存在'
    }
  }

  let selectedImagesSize = 0
  let selectedImagesFiles = 0
  for (const item of summary.images.items) {
    if (options.images[item.key]) {
      selectedImagesSize += item.size
      selectedImagesFiles += item.fileCount
    }
  }

  const videoSize = options.video ? summary.video.size : 0
  const videoFiles = options.video ? summary.video.fileCount : 0
  const audioSize = options.audio ? summary.audio.size : 0
  const audioFiles = options.audio ? summary.audio.fileCount : 0
  const fontSize = options.font ? summary.font.size : 0
  const fontFiles = options.font ? summary.font.fileCount : 0

  const segments: SelectedSyncCategorySegment[] = [
    {
      key: 'database',
      label: summary.database.label,
      size: summary.database.available ? summary.database.size : 0,
      fileCount: summary.database.available ? summary.database.fileCount : 0,
    },
    {
      key: 'settings',
      label: summary.settings.label,
      size: summary.settings.size,
      fileCount: summary.settings.fileCount,
    },
    {
      key: 'game-saves',
      label: summary.gameSaves.label,
      size: gameSaveSize,
      fileCount: gameSaveFiles,
    },
    {
      key: 'images',
      label: summary.images.label,
      size: selectedImagesSize,
      fileCount: selectedImagesFiles,
    },
    {
      key: 'video',
      label: summary.video.label,
      size: videoSize,
      fileCount: videoFiles,
    },
    {
      key: 'audio',
      label: summary.audio.label,
      size: audioSize,
      fileCount: audioFiles,
    },
    {
      key: 'font',
      label: summary.font.label,
      size: fontSize,
      fileCount: fontFiles,
    },
  ]

  const totalSize = segments.reduce((sum, segment) => sum + segment.size, 0)
  const totalFiles = segments.reduce((sum, segment) => sum + segment.fileCount, 0)

  return {
    totalSize,
    totalFiles,
    selectedImagesSize,
    selectedImagesFiles,
    canUpload: !blockingReason,
    blockingReason,
    segments,
  }
}
