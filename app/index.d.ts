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
  isSelected?: boolean
  showSelection?: boolean
  selectionMode?: boolean
  modifierSelectEnabled?: boolean
  onToggleSelect?: (id: string) => void
}
