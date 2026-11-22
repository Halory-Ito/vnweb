'use client'

import Link from 'next/link'

import type { GameDetail } from '@/types'

type GameOverviewProps = {
  game: GameDetail
  onSearch: (value: string) => void
}

const splitBySeparator = (value?: string) =>
  (value || '')
    .split(/[,，、/;；&]+/)
    .map((item) => item.trim())
    .filter(Boolean)

const OutlineTag = ({ value, onClick }: { value: string; onClick?: () => void }) => (
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
            onClick={
              onTagClick && item.trim() && item.trim() !== '-' ? () => onTagClick(item) : undefined
            }
          />
        ))
      ) : (
        <OutlineTag value="-" />
      )}
    </div>
  </div>
)

export default function GameOverview({ game, onSearch }: GameOverviewProps) {
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
                <OutlineTag key={tag} value={tag} onClick={() => onSearch(tag)} />
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
              values={splitBySeparator(game.developer)}
              onTagClick={onSearch}
            />
            <InfoRow
              label="发行商"
              values={splitBySeparator(game.publisher)}
              onTagClick={onSearch}
            />
            <InfoRow label="发售日期" values={[game.date]} onTagClick={onSearch} />
            <InfoRow
              label="游戏类型"
              values={splitBySeparator(game.gameType)}
              onTagClick={onSearch}
            />
            <InfoRow
              label="游戏引擎"
              values={splitBySeparator(game.gameEngine)}
              onTagClick={onSearch}
            />
            <InfoRow label="平台" values={game.platforms} onTagClick={onSearch} />
          </div>
        </div>

        <div>
          <div className="mb-2 text-base font-semibold">附加信息</div>
          <div className="space-y-1">
            <InfoRow label="音乐" values={splitBySeparator(game.music)} onTagClick={onSearch} />
            <InfoRow label="剧本" values={splitBySeparator(game.script)} onTagClick={onSearch} />
            <InfoRow label="美术" values={splitBySeparator(game.graphic)} onTagClick={onSearch} />
            <InfoRow
              label="原画"
              values={splitBySeparator(game.originalPainter)}
              onTagClick={onSearch}
            />
            <InfoRow
              label="动画制作"
              values={splitBySeparator(game.animationProduction)}
              onTagClick={onSearch}
            />
            <InfoRow
              label="程序"
              values={splitBySeparator(game.programmer)}
              onTagClick={onSearch}
            />
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
