'use client'

import { useAtom } from 'jotai'

import { gameSearchAtom } from '@/atom/global'
import { Input } from '@/components/ui/input'

export default function GameHeaderControls() {
  const [search, setSearch] = useAtom(gameSearchAtom)

  return (
    <Input
      className="h-10 min-w-0 md:h-9"
      type="search"
      placeholder="搜索游戏"
      aria-label="搜索游戏"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
    />
  )
}
