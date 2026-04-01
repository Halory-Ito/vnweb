import type { TemplateProps } from './classic-template'

export function MinimalTemplate({
  backgroundColor,
  titleColor,
  selectedGameInfo,
  gameCount,
  year,
  data,
}: TemplateProps) {
  const displayData = data || {
    totalHours: 42,
    totalPlayCount: 128,
    averageRating: 8.5,
    lastPlayedDate: '2024-12-15',
    topGames: [
      { title: '游戏1', cover: '', playtime: 20 },
      { title: '游戏2', cover: '', playtime: 15 },
      { title: '游戏3', cover: '', playtime: 10 },
    ],
  }

  const displayYear = year || new Date().getFullYear()
  const displayGames = displayData.topGames.slice(0, gameCount)

  return (
    <div
      className="relative w-full rounded-lg border p-6"
      style={{
        backgroundColor,
        borderColor: `${titleColor}20`,
        minHeight: '450px',
        maxWidth: '400px',
      }}
    >
      {/* 极简标题 */}
      <div className="mb-6 space-y-1">
        <h2
          className="text-lg font-medium tracking-tight"
          style={{ color: titleColor }}
        >
          游戏年度报告
        </h2>
        <p className="text-sm" style={{ color: titleColor, opacity: 0.5 }}>
          {displayYear}
        </p>
      </div>

      {/* 核心数据 */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div>
          <p
            className="text-4xl font-light tracking-tight"
            style={{ color: titleColor }}
          >
            {displayData.totalHours}
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: titleColor, opacity: 0.5 }}
          >
            游戏小时
          </p>
        </div>
        <div>
          <p
            className="text-4xl font-light tracking-tight"
            style={{ color: titleColor }}
          >
            {displayData.totalPlayCount}
          </p>
          <p
            className="mt-1 text-xs"
            style={{ color: titleColor, opacity: 0.5 }}
          >
            游玩次数
          </p>
        </div>
      </div>

      {/* 游戏封面 - Grid布局 */}
      {selectedGameInfo.includes('cover') && displayGames.length > 0 && (
        <div className="mb-4">
          <p
            className="mb-2 text-xs"
            style={{ color: titleColor, opacity: 0.5 }}
          >
            TOP {displayGames.length}
          </p>
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${Math.min(3, displayGames.length)}, 1fr)`,
            }}
          >
            {displayGames.map((game, i) => (
              <div
                key={i}
                className="overflow-hidden rounded"
                style={{
                  aspectRatio: '3/4',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
                title={game.title}
              >
                {game.cover ? (
                  <img
                    src={game.cover}
                    alt={game.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="text-xs" style={{ color: titleColor }}>
                      {game.title.substring(0, 2)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 详细信息 */}
      <div className="space-y-2">
        {selectedGameInfo.includes('playtime') && (
          <div className="flex justify-between text-sm">
            <span style={{ color: titleColor, opacity: 0.5 }}>游戏时长</span>
            <span style={{ color: titleColor }}>{displayData.totalHours}h</span>
          </div>
        )}

        {selectedGameInfo.includes('rating') && (
          <div className="flex justify-between text-sm">
            <span style={{ color: titleColor, opacity: 0.5 }}>平均评分</span>
            <span style={{ color: titleColor }}>
              {displayData.averageRating}
            </span>
          </div>
        )}

        {selectedGameInfo.includes('lastPlayed') && (
          <div className="flex justify-between text-sm">
            <span style={{ color: titleColor, opacity: 0.5 }}>最后游玩</span>
            <span style={{ color: titleColor }}>
              {displayData.lastPlayedDate}
            </span>
          </div>
        )}

        {selectedGameInfo.includes('totalPlayCount') && (
          <div className="flex justify-between text-sm">
            <span style={{ color: titleColor, opacity: 0.5 }}>游玩次数</span>
            <span style={{ color: titleColor }}>
              {displayData.totalPlayCount} 次
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
