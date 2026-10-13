import dayjs from 'dayjs'

/** 将秒数格式化为「X 小时」或「X 分钟」 */
export const formatPlayDuration = (seconds?: number | null) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0)
  if (safeSeconds <= 0) {
    return '0 分钟'
  }
  if (safeSeconds < 3600) {
    return `${Math.max(1, Math.round(safeSeconds / 60))} 分钟`
  }
  return `${(safeSeconds / 3600).toFixed(1)} 小时`
}

/** 根据小时数返回问候语 */
export const getGreeting = (hour: number) => {
  if (hour < 6) {
    return '凌晨好'
  }
  if (hour < 11) {
    return '早上好'
  }
  if (hour < 13) {
    return '中午好'
  }
  if (hour < 18) {
    return '下午好'
  }
  return '晚上好'
}

/** 首页欢迎栏的日期文案，如「2026年10月13日 星期二」 */
export const formatToday = () => {
  const now = new Date()
  return `${dayjs(now).format('YYYY年M月D日')} ${now.toLocaleDateString('zh-CN', { weekday: 'long' })}`
}

/** 热力图单元格的日期文案，如「10月13日 星期二」 */
export const formatHeatmapDayLabel = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return `${month}月${day}日 ${date.toLocaleDateString('zh-CN', { weekday: 'long' })}`
}
