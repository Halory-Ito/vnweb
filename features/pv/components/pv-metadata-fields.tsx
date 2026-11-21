import { PV_FILTERS } from '../lib/pv-library'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import type { PvMetadata } from '@/types/pv'

export function PvMetadataFields({
  value,
  onChange,
}: {
  value: PvMetadata
  onChange: (value: PvMetadata) => void
}) {
  return (
    <FieldGroup className="grid grid-cols-2 gap-3">
      <Field>
        <FieldLabel htmlFor="pv-category">分类</FieldLabel>
        <Input
          id="pv-category"
          maxLength={100}
          placeholder="输入分类名称"
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="pv-duration">时长（秒）</FieldLabel>
        <Input
          id="pv-duration"
          type="number"
          min={1}
          max={359999}
          value={value.duration ?? ''}
          onChange={(event) => onChange({ ...value, duration: event.target.valueAsNumber || null })}
        />
      </Field>
      {PV_FILTERS.map(({ key, label }) => (
        <Field key={key}>
          <FieldLabel htmlFor={`pv-${key}`}>{label}</FieldLabel>
          <Input
            id={`pv-${key}`}
            inputMode={key === 'year' ? 'numeric' : undefined}
            maxLength={key === 'year' ? 4 : 100}
            value={value[key]}
            onChange={(event) => onChange({ ...value, [key]: event.target.value })}
          />
        </Field>
      ))}
    </FieldGroup>
  )
}
