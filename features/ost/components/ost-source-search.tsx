import { Loader2Icon, SearchIcon } from 'lucide-react'

import { METING_SERVERS } from '../meting-types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { useOstForm } from '../hooks/use-ost-form'
import type { MetingServer } from '../meting-types'

export function OstSourceSearch({ state }: { state: ReturnType<typeof useOstForm> }) {
  const { form, setForm, server, setServer, mode, setMode, resetResults, search, isBusy } = state
  const canSearch =
    !!form.searchKeyword.trim() &&
    (mode === 'search'
      ? form.searchKeyword.trim().length <= 200
      : /^\d{1,30}$/.test(form.searchKeyword.trim()))
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <div className="space-y-2">
          <Label htmlFor="ost-platform">音乐平台</Label>
          <Select
            value={server}
            disabled={isBusy || mode === 'search'}
            onValueChange={(value) => {
              resetResults()
              setServer(value as MetingServer)
            }}
          >
            <SelectTrigger id="ost-platform" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(METING_SERVERS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ost-mode">读取方式</Label>
          <Select
            value={mode}
            disabled={isBusy}
            onValueChange={(value) => {
              resetResults()
              setMode(value as 'search' | 'album')
              if (value === 'search') setServer('netease')
              setForm((prev) => ({ ...prev, searchKeyword: '' }))
            }}
          >
            <SelectTrigger id="ost-mode" className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="search">专辑关键词搜索</SelectItem>
              <SelectItem value="album">专辑 ID</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ost-search">{mode === 'search' ? '搜索 OST 专辑' : '专辑 ID'}</Label>
        <div className="flex gap-2">
          <Input
            id="ost-search"
            className="min-w-0"
            inputMode={mode === 'search' ? 'text' : 'numeric'}
            placeholder={
              mode === 'search' ? '输入专辑、游戏或艺术家名称搜索...' : '输入所选平台的数字 ID'
            }
            value={form.searchKeyword}
            disabled={isBusy}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, searchKeyword: event.target.value }))
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                if (canSearch && !isBusy) search.mutate()
              }
            }}
          />
          <Button variant="outline" disabled={isBusy || !canSearch} onClick={() => search.mutate()}>
            {isBusy ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SearchIcon className="size-4" />
            )}
            {mode === 'search' ? '搜索' : '读取'}
          </Button>
        </div>
      </div>
    </div>
  )
}
