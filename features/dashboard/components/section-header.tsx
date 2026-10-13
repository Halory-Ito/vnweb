import type { LucideIcon } from 'lucide-react'

type SectionHeaderProps = {
  icon: LucideIcon
  title: string
}

export default function SectionHeader({ icon: Icon, title }: SectionHeaderProps) {
  return (
    <div className="bg-background dark:bg-input/30 dark:border-input flex items-center gap-2 rounded-xl px-3 py-2">
      <Icon size={24} className="shrink-0" />
      <div className="truncate text-lg font-bold">{title}</div>
    </div>
  )
}
