import { fieldConfigs, type useGameUpdateData } from '../../hooks/use-game-update-data'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

type Props = Pick<
  ReturnType<typeof useGameUpdateData>,
  'selectedFields' | 'selectedCount' | 'toggleField' | 'selectAllFields' | 'invertFields'
> & { disabled: boolean }

export function GameUpdateDataFields({
  disabled,
  selectedFields,
  selectedCount,
  toggleField,
  selectAllFields,
  invertFields,
}: Props) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium">选择要更新的属性（已选 {selectedCount} 项）</div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || selectedCount === fieldConfigs.length}
            onClick={selectAllFields}
          >
            全选
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={invertFields}
          >
            反选
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {fieldConfigs.map((field) => (
          <label key={field.key} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={Boolean(selectedFields[field.key])}
              onCheckedChange={(checked) => toggleField(field.key, Boolean(checked))}
              disabled={disabled}
            />
            <span>{field.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
