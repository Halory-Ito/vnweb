'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { ArrowLeftIcon, ArrowRightIcon, FilterIcon, XIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import GameAddButton from '../vndb/vndb-trigger'
import R18Switch from './r18-switch'
import ThemeSwitch from './theme-switch'
import {
  defaultGameFilter,
  gameFilterAtom,
  gameSearchAtom,
} from '@/atom/global'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getGameFilterOptions } from '@/lib/game-utils'

import type { GameFilterState } from '@/types/game-types'

export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [gameSearch, setGameSearch] = useAtom(gameSearchAtom)
  const [gameFilter, setGameFilter] = useAtom(gameFilterAtom)
  const { data: filterOptions } = useQuery({
    queryKey: ['game-filter-options'],
    queryFn: getGameFilterOptions,
  })

  const handleFilterChange = <K extends keyof GameFilterState>(
    key: K,
    value: GameFilterState[K],
  ) => {
    setGameFilter((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="flex w-full items-center justify-between border-b p-4">
      <div className="flex space-x-4">
        <Button onClick={router.back} variant="outline" size="icon">
          <ArrowLeftIcon />
        </Button>
        <Button onClick={router.forward} variant="outline" size="icon">
          <ArrowRightIcon />
        </Button>
        <GameAddButton />
        {pathname.startsWith('/game') && (
          <>
            <Field orientation="horizontal">
              <Input
                className="w-28 sm:w-64 md:w-72 lg:w-96"
                type="search"
                placeholder="搜索"
                value={gameSearch}
                onChange={(event) => setGameSearch(event.target.value)}
              />
            </Field>
            {/* <Button variant="outline" size="icon">
              <HomeIcon className="w-4 h-4" />
            </Button> */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <FilterIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-96">
                <div className="space-y-3">
                  <div className="text-sm font-medium">筛选游戏</div>

                  <div className="flex items-center justify-between gap-2">
                    <Input
                      className="w-64"
                      type="date"
                      value={gameFilter.releaseDateFrom}
                      onChange={(event) =>
                        handleFilterChange(
                          'releaseDateFrom',
                          event.target.value,
                        )
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleFilterChange('releaseDateFrom', '')}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Input
                      className="w-64"
                      type="date"
                      value={gameFilter.releaseDateTo}
                      onChange={(event) =>
                        handleFilterChange('releaseDateTo', event.target.value)
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleFilterChange('releaseDateTo', '')}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Select
                      value={gameFilter.playStatus || 'all'}
                      onValueChange={(value) =>
                        handleFilterChange(
                          'playStatus',
                          value === 'all' ? '' : value,
                        )
                      }
                    >
                      <SelectTrigger className="w-64">
                        <SelectValue
                          className="truncate"
                          placeholder="游玩状态"
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部状态</SelectItem>
                        <SelectItem value="0">未开始</SelectItem>
                        <SelectItem value="1">游玩中</SelectItem>
                        <SelectItem value="2">部分完成</SelectItem>
                        <SelectItem value="3">已完成</SelectItem>
                        <SelectItem value="4">多周目</SelectItem>
                        <SelectItem value="5">搁置中</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleFilterChange('playStatus', '')}
                    >
                      <XIcon className="size-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.developer || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'developer',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="开发商"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">开发商</SelectItem>
                          {(filterOptions?.developers ?? []).map((item) => (
                            <SelectItem key={`developer-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('developer', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.publisher || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'publisher',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="发行商"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">发行商</SelectItem>
                          {(filterOptions?.publishers ?? []).map((item) => (
                            <SelectItem key={`publisher-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('publisher', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.category || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'category',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="类别"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">类别</SelectItem>
                          {(filterOptions?.categories ?? []).map((item) => (
                            <SelectItem key={`category-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('category', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.platform || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'platform',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="平台"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">平台</SelectItem>
                          {(filterOptions?.platforms ?? []).map((item) => (
                            <SelectItem key={`platform-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('platform', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.tags || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'tags',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="标签"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">标签</SelectItem>
                          {(filterOptions?.tags ?? []).map((item) => (
                            <SelectItem key={`tags-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('tags', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.originalPainter || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'originalPainter',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="原画"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">原画</SelectItem>
                          {(filterOptions?.originalPainters ?? []).map(
                            (item) => (
                              <SelectItem
                                key={`originalPainter-${item}`}
                                value={item}
                              >
                                {item}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleFilterChange('originalPainter', '')
                        }
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.script || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'script',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="脚本"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">脚本</SelectItem>
                          {(filterOptions?.scripts ?? []).map((item) => (
                            <SelectItem key={`script-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('script', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.music || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'music',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="音乐"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">音乐</SelectItem>
                          {(filterOptions?.musics ?? []).map((item) => (
                            <SelectItem key={`music-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('music', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.engine || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'engine',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="引擎"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">引擎</SelectItem>
                          {(filterOptions?.engines ?? []).map((item) => (
                            <SelectItem key={`engine-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('engine', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <Select
                        value={gameFilter.planning || 'all'}
                        onValueChange={(value) =>
                          handleFilterChange(
                            'planning',
                            value === 'all' ? '' : value,
                          )
                        }
                      >
                        <SelectTrigger className="w-64">
                          <SelectValue
                            className="truncate"
                            placeholder="企划"
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">企划</SelectItem>
                          {(filterOptions?.plannings ?? []).map((item) => (
                            <SelectItem key={`planning-${item}`} value={item}>
                              {item}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleFilterChange('planning', '')}
                      >
                        <XIcon className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setGameFilter(defaultGameFilter)}
                    >
                      重置筛选
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>
      <div className="flex gap-4">
        <R18Switch />
        <ThemeSwitch />
      </div>
    </div>
  )
}
