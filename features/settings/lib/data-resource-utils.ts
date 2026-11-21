import type { ResourceCategory } from '../settings-api'

export type ResourceCategoryFilter = 'all' | ResourceCategory

export type ResourceSortOption = 'date-desc' | 'size-desc' | 'size-asc' | 'name-asc'

export const RESOURCE_CATEGORY_META: Record<
  ResourceCategory,
  {
    label: string
    emptyLabel: string
  }
> = {
  image: {
    label: '图片',
    emptyLabel: '暂无本地图片资源',
  },
  video: {
    label: '视频',
    emptyLabel: '暂无本地视频资源',
  },
  audio: {
    label: '音频',
    emptyLabel: '暂无本地音频资源',
  },
  font: {
    label: '字体',
    emptyLabel: '暂无本地字体资源',
  },
}

export const RESOURCE_CATEGORY_ORDER: ResourceCategory[] = ['image', 'video', 'audio', 'font']

export function formatResourceSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function formatResourceDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
