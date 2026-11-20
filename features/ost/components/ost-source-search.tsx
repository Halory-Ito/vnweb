import { Loader2Icon, SearchIcon, XIcon } from 'lucide-react'

import { METING_SERVERS } from '../meting-types'
import { Badge } from '@/components/ui/badge'
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

export function OstSourceSearch({
  state,
  disabled,
}: {
  state: ReturnType<typeof useOstForm>
  disabled: boolean
}) {
  const { form, setForm, server, setServer, mode, setMode, resetResults, runSearch } = state
  const isBusy = disabled || state.isBusy
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
            aria-invalid={state.hasInvalidIds}
            aria-describedby={mode === 'album' ? 'ost-id-hint' : undefined}
            placeholder={
              mode === 'search' ? '输入专辑、游戏或艺术家名称搜索...' : '例如 12345, 67890'
            }
            value={form.searchKeyword}
            disabled={isBusy}
            onChange={(event) => state.changeSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                event.preventDefault()
                if (!isBusy) runSearch()
              }
            }}
          />
          <Button variant="outline" disabled={isBusy || !state.canSearch} onClick={runSearch}>
            {state.isBusy ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <SearchIcon className="size-4" />
            )}
            {mode === 'search' ? '搜索' : '读取'}
          </Button>
        </div>
        {mode === 'album' && (
          <>
            <p
              id="ost-id-hint"
              className={
                state.hasInvalidIds ? 'text-destructive text-sm' : 'text-muted-foreground text-sm'
              }
            >
              {state.hasInvalidIds ? '每个专辑 ID 须为 1 至 30 位数字' : '多个专辑 ID 用逗号分隔'}
            </p>
            {state.ids.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {state.ids.map((id) => (
                  <Badge key={id} variant="outline" className="h-auto max-w-full gap-1">
                    <span className="min-w-0 truncate" title={id}>
                      {id}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`移除 ID ${id}`}
                      disabled={isBusy}
                      onClick={() =>
                        state.changeSearchInput(
                          state.ids.filter((value) => value !== id).join(', '),
                        )
                      }
                    >
                      <XIcon />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
