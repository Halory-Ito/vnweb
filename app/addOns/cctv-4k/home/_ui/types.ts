export type SourceHealth = {
  available: boolean
  latencyMs: number | null
  playableCount: number
  checkedAt: number
  error?: string
}
