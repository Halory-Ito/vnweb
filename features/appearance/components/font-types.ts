export type LocalFontItem = {
  name: string
  filename?: string
  path: string
  source: 'system' | 'user'
}

export type FontSourceFilter = 'all' | 'system' | 'user'
