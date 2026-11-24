/** 同步服务器提供者类型 */
export type SyncProvider = 'webdav' | 's3'

/**
 * 同步服务器配置
 *
 * 字段按 provider 使用，未使用的字段留空即可：
 * - webdav：server / username / password
 * - s3：endpoint / bucket / region / accessKeyId / secretAccessKey / forcePathStyle
 *
 * 采用扁平可选结构而非联合类型，便于编辑表单在不同 provider 间切换时保留字段值。
 */
export type SyncServerConfig = {
  id: string
  name: string
  provider: SyncProvider
  enabled: boolean
  remotePath: string

  // WebDAV
  server?: string
  username?: string
  password?: string

  // S3 兼容对象存储
  endpoint?: string
  bucket?: string
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  forcePathStyle?: boolean
}

/** 同步服务器多配置存储结构 */
export type SyncConfigStore = {
  configs: SyncServerConfig[]
  autoBackup: boolean
  autoBackupInterval: number
}

/** 返回给前端的配置（密码类字段以掩码形式呈现） */
export type SyncServerConfigView = SyncServerConfig

export type BackupImageCategoryKey =
  | 'cover'
  | 'ostCover'
  | 'background'
  | 'customBackground'
  | 'character'
  | 'cg'
  | 'icon'
  | 'logo'
  | 'brand'
  | 'memory'
  | 'other'

export type BackupContentOptions = {
  gameSaves: boolean
  images: Record<BackupImageCategoryKey, boolean>
  video: boolean
  audio: boolean
  font: boolean
}

export type BackupCategoryStat = {
  label: string
  fileCount: number
  size: number
}

export type BackupImageSubCategoryStat = BackupCategoryStat & {
  key: BackupImageCategoryKey
}

export type SyncUploadPreviewSummary = {
  options: BackupContentOptions
  database: BackupCategoryStat & {
    available: boolean
    unavailableReason?: string
  }
  gameSaves: BackupCategoryStat & {
    status: 'available' | 'disabled' | 'missing'
    unavailableReason?: string
  }
  images: {
    label: string
    totalFileCount: number
    totalSize: number
    items: BackupImageSubCategoryStat[]
  }
  video: BackupCategoryStat
  audio: BackupCategoryStat
  font: BackupCategoryStat
}

export type RemoteBackupMeta = {
  version: number
  backupName: string
  backupDate: string
  totalSize: number
  totalFiles: number
  categories: string[]
  options?: BackupContentOptions
}

export type RemoteBackupStatus = {
  exists: boolean
  backupName?: string
  backupDate?: string
  categories?: string[]
  totalSize?: number
  totalFiles?: number
}

export type RemoteDownloadCategorySummary = {
  key: 'database' | 'game-saves' | 'images' | 'video' | 'audio' | 'font'
  label: string
  fileCount: number
  size: number
}

export type SyncDownloadPreviewSummary = {
  exists: boolean
  backupName: string
  backupDate: string
  totalSize: number
  totalFiles: number
  categories: RemoteDownloadCategorySummary[]
  imageItems: BackupImageSubCategoryStat[]
  gameSaveEnabled: boolean
  hasGameSaves: boolean
}
