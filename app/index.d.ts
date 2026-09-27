type GameCardProps = {
  id: string
  title: string
  cover: string
  href?: string
  publishAt: string
  lastRunAt: string
  addedAt: string
  playTime: number
  rating: number
  // 游戏游玩状态：0未开始、1游玩中、2部分完成、3已完成、4多周目、5搁置中
  status?: number
  isSelected?: boolean
  showSelection?: boolean
  selectionMode?: boolean
  modifierSelectEnabled?: boolean
  showPlayInfo?: boolean
  onToggleSelect?: (id: string) => void
}
