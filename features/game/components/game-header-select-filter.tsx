import { XIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type GameHeaderSelectFilterProps = {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

export default function GameHeaderSelectFilter({
  label,
  value,
  options,
  onChange,
}: GameHeaderSelectFilterProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Select value={value || 'all'} onValueChange={(next) => onChange(next === 'all' ? '' : next)}>
        <SelectTrigger className="w-full min-w-0 flex-1" aria-label={label}>
          <SelectValue className="truncate" placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{label}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label={`清除${label}筛选`}
        onClick={() => onChange('')}
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  )
}
