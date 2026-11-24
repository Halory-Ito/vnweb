export function getGuideProgressColor(percent: number): string {
  if (percent >= 100) return 'text-emerald-600 dark:text-emerald-400'
  if (percent >= 75) return 'text-sky-600 dark:text-sky-400'
  if (percent >= 50) return 'text-amber-600 dark:text-amber-400'
  if (percent > 0) return 'text-rose-600 dark:text-rose-400'
  return 'text-muted-foreground'
}

export const GUIDE_PROGRESS_BAR_CLASS =
  'bg-current/20 [&_[data-slot=progress-indicator]]:bg-current'

export const GUIDE_COMPLETED_CARD_CLASS =
  'border-emerald-500/40 bg-emerald-500/5 dark:border-emerald-500/40 dark:bg-emerald-500/10'

export const GUIDE_COMPLETED_BADGE_CLASS =
  'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
