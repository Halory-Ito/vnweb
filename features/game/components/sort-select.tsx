'use client'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SortSelectProps {
  orderBy: string
  setOrderBy: (value: string) => void
}

export function SortSelect({ orderBy, setOrderBy }: SortSelectProps) {
  return (
    <FieldGroup className="w-36">
      <Field>
        <Select defaultValue={orderBy} onValueChange={setOrderBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              <SelectItem value="name">名称</SelectItem>
              <SelectItem value="public_date">发布日期</SelectItem>
              <SelectItem value="last_run">最后运行日期</SelectItem>
              <SelectItem value="add_date">添加日期</SelectItem>
              <SelectItem value="play_time">游玩时间</SelectItem>
              <SelectItem value="rating">评分</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
}
