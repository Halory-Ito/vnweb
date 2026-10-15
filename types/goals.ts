/** 首页目标设置 */
export type GoalSettings = {
  /** 每日游玩时长目标（分钟） */
  dailyPlayMinutes: number
  /** 今年计划完成的游戏数量 */
  yearlyCompletedGames: number
}

/** 首页目标进度 */
export type GoalProgress = {
  /** 统计日期 YYYY-MM-DD */
  date: string
  /** 当前年份 */
  year: number
  /** 今日游玩时长（秒） */
  todaySeconds: number
  /** 今年已完成的游戏数量 */
  completedThisYear: number
}
