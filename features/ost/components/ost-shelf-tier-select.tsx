import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const tierOptions = ['1', '2', '3', '4', '5']

export function OstShelfTierSelect({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="ost-shelf-tiers" className="text-muted-foreground text-sm">
        层数
      </label>
      <Select value={String(value)} onValueChange={(value) => onChange(Number(value))}>
        <SelectTrigger id="ost-shelf-tiers" className="h-8 w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {tierOptions.map((option) => (
            <SelectItem key={option} value={option}>
              {option} 层
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
