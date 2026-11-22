'use client'

import { useAtom } from 'jotai'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { gameLibraryLayoutAtom, isGameLibraryLayout } from '@/lib/settings/game-library-layout'

export default function GameLibraryLayoutSelect({ id }: { id?: string }) {
  const [layout, setLayout] = useAtom(gameLibraryLayoutAtom)

  return (
    <Select
      value={layout}
      onValueChange={(value) => {
        if (isGameLibraryLayout(value)) setLayout(value)
      }}
    >
      <SelectTrigger id={id} aria-label="游戏库布局" size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="mixed">列表</SelectItem>
          <SelectItem value="grid">网格</SelectItem>
          <SelectItem value="hybrid">混合</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
