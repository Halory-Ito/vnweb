'use client'

import { useAtom } from 'jotai'

import { getLibraryGroup, LIBRARY_GROUP_LABELS } from '../lib/library-grouping'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { gameLibraryGroupAtom } from '@/lib/settings/game-library-group'

export default function LibraryGroupSelect({ id }: { id: string }) {
  const [groupBy, setGroupBy] = useAtom(gameLibraryGroupAtom)

  return (
    <Select value={groupBy} onValueChange={(value) => setGroupBy(getLibraryGroup(value))}>
      <SelectTrigger id={id} size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {Object.entries(LIBRARY_GROUP_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
