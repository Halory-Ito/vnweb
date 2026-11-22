export const ENHANCED_QUALITY_OPTIONS = [
  { value: 'standard', label: '标准' },
  { value: 'exhigh', label: '极高' },
  { value: 'lossless', label: '无损' },
  { value: 'hires', label: 'Hi-Res' },
  { value: 'jyeffect', label: '高清臻音' },
  { value: 'vivid', label: '臻音全景声' },
  { value: 'jymaster', label: '超清母带' },
  { value: 'sky', label: '沉浸环绕声' },
] as const

export type EnhancedQuality = (typeof ENHANCED_QUALITY_OPTIONS)[number]['value']

export const DEFAULT_ENHANCED_QUALITY: EnhancedQuality = 'standard'

export function isEnhancedQuality(value: unknown): value is EnhancedQuality {
  return ENHANCED_QUALITY_OPTIONS.some((option) => option.value === value)
}
