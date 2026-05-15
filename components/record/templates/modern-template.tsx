import type { TemplateProps } from './classic-template'

export function ModernTemplate({
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

  // Calculate gradient colors based on background
  const gradientStart = adjustBrightness(backgroundColor, 20)
  const gradientEnd = adjustBrightness(backgroundColor, -30)

  return (
    <div
      className="relative mx-auto w-full rounded-2xl p-6 shadow-2xl"
      style={{
        background: `linear-gradient(135deg, ${gradientStart} 0%, ${backgroundColor} 50%, ${gradientEnd} 100%)`,
        minHeight: '450px',
        maxWidth: '400px',
      }}
    >
      {/* 装饰性圆形 */}
      <div
        className="absolute rounded-full"
        style={{
          top: '-32px',
          right: '-32px',
          width: '80px',
          height: '80px',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          bottom: '-16px',
          left: '-16px',
          width: '60px',
          height: '60px',
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />

      {/* 主要内容 */}
      <div className="relative space-y-4">
        {/* 标题区域 */}
        <div className="space-y-2 text-center">
          <div
            className="inline-block rounded-full px-4 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <span className="text-sm font-medium" style={{ color: titleColor }}>
              {displayYear} 年度游戏报告
            </span>
          </div>
          <h2
            className="text-2xl font-bold"
            style={{
              color: titleColor,
            }}
          >
            我的游戏记录
          </h2>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded-xl p-3 text-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-2xl font-bold" style={{ color: titleColor }}>
              {displayData.totalHours}
            </p>
            <p
              className="mt-1 text-xs opacity-60"
              style={{ color: titleColor }}
            >
              总游戏时长
            </p>
          </div>
          <div
            className="rounded-xl p-3 text-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-2xl font-bold" style={{ color: titleColor }}>
              {displayData.totalPlayCount}
            </p>
            <p
              className="mt-1 text-xs opacity-60"
              style={{ color: titleColor }}
            >
              游戏次数
            </p>
          </div>
          <div
            className="rounded-xl p-3 text-center backdrop-blur-sm"
            style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
          >
            <p className="text-2xl font-bold" style={{ color: titleColor }}>
              {displayData.averageRating}
            </p>
            <p
              className="mt-1 text-xs opacity-60"
              style={{ color: titleColor }}
            >
              平均评分
            </p>
          </div>
        </div>

        {/* 游戏封面展示 - Grid布局 */}
        {selectedGameInfo.includes('cover') && displayGames.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: titleColor }}>
                Top {displayGames.length} 游戏
              </p>
            </div>
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${Math.min(3, displayGames.length)}, 1fr)`,
              }}
            >
              {displayGames.map((game, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-md transition-transform hover:scale-105"
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
                      <span
                        className="text-xs opacity-80"
                        style={{ color: titleColor }}
                      >
                        {game.title.substring(0, 2)}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute right-0 bottom-0 left-0 p-1 text-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <span className="text-xs" style={{ color: titleColor }}>
                      {game.playtime}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 游戏时长进度条 */}
        {selectedGameInfo.includes('playtime') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium" style={{ color: titleColor }}>
                年度进度
              </p>
              <span
                className="text-sm opacity-60"
                style={{ color: titleColor }}
              >
                75%
              </span>
            </div>
            <div
              className="h-3 overflow-hidden rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
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

        {/* 详细信息行 */}
        <div
          className="flex items-center justify-between rounded-xl p-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          {selectedGameInfo.includes('lastPlayed') && (
            <div className="text-center">
              <p className="text-xs opacity-60" style={{ color: titleColor }}>
                最近游玩
              </p>
              <p className="font-medium" style={{ color: titleColor }}>
                {displayData.lastPlayedDate}
              </p>
            </div>
          )}
          {selectedGameInfo.includes('totalPlayCount') && (
            <div className="text-center">
              <p className="text-xs opacity-60" style={{ color: titleColor }}>
                总游玩次数
              </p>
              <p className="font-medium" style={{ color: titleColor }}>
                {displayData.totalPlayCount} 次
              </p>
            </div>
          )}
          {selectedGameInfo.includes('rating') && (
            <div className="text-center">
              <p className="text-xs opacity-60" style={{ color: titleColor }}>
                评分
              </p>
              <p className="font-medium" style={{ color: titleColor }}>
                ⭐ {displayData.averageRating}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 辅助函数：调整颜色亮度
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = Math.max(0, Math.min(255, (num >> 16) + amt))
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt))
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt))
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`
}
