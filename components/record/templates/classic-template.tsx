export type TemplateProps = {
  backgroundColor: string
  titleColor: string
  selectedGameInfo: string[]
  gameCount: number
  year?: number
  data?: {
    totalHours: number
    totalPlayCount: number
    averageRating: number
    lastPlayedDate: string
    topGames: Array<{
      title: string
      cover: string
      playtime: number
    }>
  }
}

export function ClassicTemplate({
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
      className="relative w-full rounded-xl p-6 shadow-2xl"
      style={{
        backgroundColor,
        minHeight: '450px',
        maxWidth: '400px',
      }}
    >
      {/* 主要内容 */}
      <div className="space-y-4">
        {/* 标题区域 */}
        <div className="space-y-1 text-center">
          <h2 className="text-xl font-bold" style={{ color: titleColor }}>
            我的游戏年度报告
          </h2>
          <p className="text-sm opacity-70" style={{ color: titleColor }}>
            {displayYear} 年度游戏总结
          </p>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <p className="text-2xl font-bold" style={{ color: titleColor }}>
              {displayData.totalHours}
            </p>
            <p className="text-xs opacity-70" style={{ color: titleColor }}>
              总游戏时长(小时)
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <p className="text-2xl font-bold" style={{ color: titleColor }}>
              {displayData.totalPlayCount}
            </p>
            <p className="text-xs opacity-70" style={{ color: titleColor }}>
              游戏次数
            </p>
          </div>
        </div>

        {/* 游戏封面展示 - Grid布局 */}
        {selectedGameInfo.includes('cover') && displayGames.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: titleColor }}>
              Top {displayGames.length} 游戏
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
                  className="relative overflow-hidden rounded-md"
                  style={{
                    aspectRatio: '3/4',
                    backgroundColor: 'rgba(255,255,255,0.2)',
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

        {/* 游戏时长 */}
        {selectedGameInfo.includes('playtime') && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: titleColor }}>
              游戏时长
            </p>
            <div
              className="h-2 w-full rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: '75%',
                  backgroundColor: 'rgba(255,255,255,0.5)',
                }}
              />
            </div>
          </div>
        )}

        {/* 游戏评分 */}
        {selectedGameInfo.includes('rating') && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: titleColor }}>
              平均评分
            </p>
            <p className="text-xl font-bold" style={{ color: titleColor }}>
              {displayData.averageRating}
            </p>
          </div>
        )}

        {/* 最后游玩时间 */}
        {selectedGameInfo.includes('lastPlayed') && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: titleColor }}>
              最近游玩
            </p>
            <p className="text-sm opacity-70" style={{ color: titleColor }}>
              {displayData.lastPlayedDate}
            </p>
          </div>
        )}

        {/* 总游玩次数 */}
        {selectedGameInfo.includes('totalPlayCount') && (
          <div className="space-y-2">
            <p className="text-sm font-medium" style={{ color: titleColor }}>
              总游玩次数
            </p>
            <p className="text-xl font-bold" style={{ color: titleColor }}>
              {displayData.totalPlayCount}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
