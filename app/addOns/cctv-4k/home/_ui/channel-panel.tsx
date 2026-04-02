import { ListVideo, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { LiveChannel } from '../../utils'

type ChannelPanelProps = {
  totalLabel: string
  showSearch: boolean
  channelKeywordInput: string
  onlyPlayable: boolean
  filteredChannels: LiveChannel[]
  hasChannels: boolean
  activeIndex: number
  onToggleSearch: () => void
  onChangeKeyword: (value: string) => void
  onToggleOnlyPlayable: (checked: boolean) => void
  onSelectChannel: (index: number) => void
  getOriginalIndex: (channel: LiveChannel) => number
}

export function ChannelPanel({
  totalLabel,
  showSearch,
  channelKeywordInput,
  onlyPlayable,
  filteredChannels,
  hasChannels,
  activeIndex,
  onToggleSearch,
  onChangeKeyword,
  onToggleOnlyPlayable,
  onSelectChannel,
  getOriginalIndex,
}: ChannelPanelProps) {
  return (
    <Card variant="outline">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListVideo className="size-4 text-red-500" />
            节目切换
          </CardTitle>
          <Button
            size="icon"
            variant="outline"
            className="size-8"
            onClick={onToggleSearch}
          >
            <Search className="size-4" />
          </Button>
        </div>
        <CardDescription>{totalLabel}</CardDescription>
        {showSearch && (
          <div className="space-y-3 pt-2">
            <Input
              value={channelKeywordInput}
              onChange={(event) => onChangeKeyword(event.target.value)}
              placeholder="按频道名称搜索..."
            />
            <Label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={onlyPlayable}
                onCheckedChange={(checked) =>
                  onToggleOnlyPlayable(Boolean(checked))
                }
              />
              仅显示可播放
            </Label>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredChannels.length > 0 ? (
          <div className="max-h-[60vh] space-y-2 overflow-auto pr-1">
            {filteredChannels.map((channel) => {
              const index = getOriginalIndex(channel)
              if (index < 0) {
                return null
              }
              const active = activeIndex === index
              return (
                <button
                  type="button"
                  key={channel.id}
                  onClick={() => onSelectChannel(index)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    active
                      ? 'border-red-500 bg-red-500/10 text-red-600'
                      : 'hover:bg-muted/80'
                  }`}
                >
                  <div className="line-clamp-1 font-medium">{channel.name}</div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            {hasChannels
              ? '没有匹配的频道。'
              : '暂无频道，请先选择有效直播源。'}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
