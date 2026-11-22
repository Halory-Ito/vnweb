export type ResourceCategory = 'image' | 'video' | 'audio' | 'font'

export const IMAGE_USAGE_LABELS = {
  cover: '封面',
  character: '角色立绘',
  logo: 'Logo',
  background: '背景',
  icon: '游戏图标',
  cg: '游戏 CG',
  memory: '回忆图片',
  other: '其他图片',
} as const

export type ImageUsage = keyof typeof IMAGE_USAGE_LABELS

export type LocalResourceItem = {
  id: string
  name: string
  relativePath: string
  url: string
  category: ResourceCategory
  imageUsage?: ImageUsage
  folder: string
  extension: string
  size: number
  modifiedAt: string
}

export type ResourceCategorySummary = { count: number; size: number }

export type LocalResourceSummary = {
  totalCount: number
  totalSize: number
  categories: Record<ResourceCategory, ResourceCategorySummary>
  imagesByUsage: Partial<Record<ImageUsage, ResourceCategorySummary>>
}

export type LocalResourcesResponse = {
  summary: LocalResourceSummary
  unusedSummary: LocalResourceSummary
  items: LocalResourceItem[]
}
