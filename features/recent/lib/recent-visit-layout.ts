/** 与服务端最多保留 60 条访问记录的范围一致。 */
export const RECENT_VISIT_FETCH_LIMIT = 60

export const RECENT_VISIT_INITIAL_COLUMNS = 2

export const RECENT_VISIT_GRID_CLASS =
  'grid min-w-0 w-full grid-cols-[repeat(auto-fit,minmax(min(100%,var(--recent-card-min-width)),1fr))] gap-2.5 [--recent-card-min-width:128px] sm:gap-3 sm:[--recent-card-min-width:174px]'
