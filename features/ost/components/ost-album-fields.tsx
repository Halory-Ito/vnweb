import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function OstAlbumFields({
  id,
  name,
  cover,
  disabled,
  onChange,
}: {
  id: string
  name: string
  cover: string
  disabled: boolean
  onChange: (patch: Partial<{ name: string; cover: string }>) => void
}) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${id}-name`}>OST 名称</Label>
        <Input
          id={`${id}-name`}
          value={name}
          disabled={disabled}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="输入 OST 名称"
        />
      </div>
      <div className="grid min-w-0 gap-2">
        <Label htmlFor={`${id}-cover`}>封面图片</Label>
        <Input
          id={`${id}-cover`}
          value={cover}
          disabled={disabled}
          onChange={(event) => onChange({ cover: event.target.value })}
          placeholder="输入封面图片 URL"
        />
      </div>
    </div>
  )
}
