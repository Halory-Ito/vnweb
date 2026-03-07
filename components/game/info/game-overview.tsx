'use client'

import Link from 'next/link'

import type { GameDetail } from '@/lib/game-utils'
import type { GameFilterState } from '@/types/game-types'

type GameOverviewProps = {
  game: GameDetail
  onApplyTagFilter: (
    field: keyof GameFilterState,
    value: string,
    fieldLabel: string,
  ) => void
}

const splitByDunhao = (value?: string) =>
  (value || '')
    .split('、')
    .map((item) => item.trim())
    .filter(Boolean)

const OutlineTag = ({
  value,
  onClick,
}: {
  value: string
  onClick?: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className="bg-background text-foreground dark:bg-input/30 dark:border-input hover:bg-accent hover:text-accent-foreground inline-flex rounded-md border px-2 py-0.5 text-xs shadow-xs transition-colors disabled:pointer-events-none"
  >
    {value}
  </button>
)

const InfoRow = ({
  label,
  values,
  onTagClick,
}: {
  label: string
  values?: string[]
  onTagClick?: (value: string) => void
}) => (
  <div className="flex gap-2 text-sm">
    <span className="w-24 shrink-0">{label}</span>
    <div className="flex flex-wrap gap-1.5">
      {(values || []).length > 0 ? (
        (values || []).map((item) => (
          <OutlineTag
            key={`${label}-${item}`}
            value={item}
            onClick={onTagClick ? () => onTagClick(item) : undefined}
          />
        ))
      ) : (
        <OutlineTag value="-" />
      )}
    </div>
  </div>
)

export default function GameOverview({
  game,
  onApplyTagFilter,
}: GameOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-md border p-4">
        <div>
          <div className="mb-2 text-base font-semibold">游戏简介</div>
          <div className="text-foreground/90 text-sm leading-6 whitespace-pre-wrap">
            {game.summary || '-'}
          </div>
        </div>

        <div>
          <div className="mb-2 text-base font-semibold">游戏标签</div>
          <div className="flex flex-wrap gap-2">
            {game.tags.length > 0 ? (
              game.tags.map((tag) => (
                <OutlineTag
                  key={tag}
                  value={tag}
                  onClick={() => onApplyTagFilter('tags', tag, '标签')}
                />
              ))
            ) : (
              <OutlineTag value="-" />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <div>
          <div className="mb-2 text-base font-semibold">基本信息</div>
          <div className="space-y-1">
            <InfoRow
              label="开发商"
              values={splitByDunhao(game.developer)}
              onTagClick={(value) =>
                onApplyTagFilter('developer', value, '开发商')
              }
            />
            <InfoRow
              label="发行商"
              values={splitByDunhao(game.publisher)}
              onTagClick={(value) =>
                onApplyTagFilter('publisher', value, '发行商')
              }
            />
            <InfoRow label="发售日期" values={[game.date]} />
            <InfoRow
              label="游戏类型"
              values={splitByDunhao(game.gameType)}
              onTagClick={(value) =>
                onApplyTagFilter('category', value, '游戏类型')
              }
            />
            <InfoRow
              label="游戏引擎"
              values={splitByDunhao(game.gameEngine)}
              onTagClick={(value) =>
                onApplyTagFilter('engine', value, '游戏引擎')
              }
            />
            <InfoRow
              label="平台"
              values={game.platforms}
              onTagClick={(value) =>
                onApplyTagFilter('platform', value, '平台')
              }
            />
          </div>
        </div>

        <div>
          <div className="mb-2 text-base font-semibold">附加信息</div>
          <div className="space-y-1">
            <InfoRow
              label="音乐"
              values={splitByDunhao(game.music)}
              onTagClick={(value) => onApplyTagFilter('music', value, '音乐')}
            />
            <InfoRow
              label="剧本"
              values={splitByDunhao(game.script)}
              onTagClick={(value) => onApplyTagFilter('script', value, '剧本')}
            />
            <InfoRow label="美术" values={splitByDunhao(game.graphic)} />
            <InfoRow
              label="原画"
              values={splitByDunhao(game.originalPainter)}
              onTagClick={(value) =>
                onApplyTagFilter('originalPainter', value, '原画')
              }
            />
            <InfoRow
              label="动画制作"
              values={splitByDunhao(game.animationProduction)}
            />
            <InfoRow label="程序" values={splitByDunhao(game.programmer)} />
          </div>
        </div>

        <div>
          <div className="mb-2 text-base font-semibold">相关网站</div>
          <div className="space-y-1 text-sm">
            {game.websites.length > 0 ? (
              game.websites.map((website) => (
                <Link
                  key={website.id}
                  href={website.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary block break-all hover:underline"
                >
                  {website.name}
                </Link>
              ))
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
