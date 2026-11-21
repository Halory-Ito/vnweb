import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { GameOption, PvFormState } from '../types'

type Props = {
  gameOptions: GameOption[]
  form: PvFormState
  onGameIdChange: (value: string) => void
  onNameChange: (value: string) => void
  onUrlChange?: (value: string) => void
}

export function PvBasicFields({
  gameOptions,
  form,
  onGameIdChange,
  onNameChange,
  onUrlChange,
}: Props) {
  return (
    <FieldGroup className="gap-3">
      <Field>
        <FieldLabel htmlFor="pv-game">游戏</FieldLabel>
        <Select value={form.gameId} onValueChange={onGameIdChange}>
          <SelectTrigger id="pv-game" className="w-full">
            <SelectValue placeholder="请选择游戏" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {gameOptions.map((game) => (
                <SelectItem key={game.id} value={game.id}>
                  {game.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel htmlFor="pv-name">PV 名称</FieldLabel>
        <Input
          id="pv-name"
          value={form.name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </Field>
      {onUrlChange && (
        <Field>
          <FieldLabel htmlFor="pv-url">PV 链接</FieldLabel>
          <Input
            id="pv-url"
            value={form.url}
            onChange={(event) => onUrlChange(event.target.value)}
          />
        </Field>
      )}
    </FieldGroup>
  )
}
