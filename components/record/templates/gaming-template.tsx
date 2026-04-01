import type { TemplateProps } from './classic-template'

export function GamingTemplate({
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

  // Gaming accent colors
  const neonCyan = '#00f5ff'
  const neonPink = '#ff00ff'

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl p-6 shadow-2xl"
      style={{
        backgroundColor,
        minHeight: '450px',
        maxWidth: '400px',
      }}
    >
      {/* 霓虹边框效果 */}
      <div
        className="absolute inset-0 rounded-xl"
        style={{
          border: '2px solid',
          borderColor: `${neonCyan}40`,
          boxShadow: `inset 0 0 20px ${neonCyan}20`,
        }}
      />

      {/* 装饰性网格线 */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.1,
          backgroundImage: `
            linear-gradient(${neonCyan}20 1px, transparent 1px),
            linear-gradient(90deg, ${neonCyan}20 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
      />

      {/* 角落装饰 - 左上角 */}
      <div className="absolute" style={{ top: '12px', left: '12px' }}>
        <div
          className="h-6 w-6"
          style={{
            borderTop: '2px solid',
            borderLeft: '2px solid',
            borderColor: neonCyan,
          }}
        />
      </div>
      <div className="absolute" style={{ top: '18px', left: '18px' }}>
        <div
          className="h-3 w-3"
          style={{
            borderTop: '1px solid',
            borderLeft: '1px solid',
            borderColor: neonPink,
          }}
        />
      </div>

      {/* 角落装饰 - 右下角 */}
      <div className="absolute" style={{ right: '12px', bottom: '12px' }}>
        <div
          className="h-6 w-6"
          style={{
            borderBottom: '2px solid',
            borderRight: '2px solid',
            borderColor: neonCyan,
          }}
        />
      </div>
      <div className="absolute" style={{ right: '18px', bottom: '18px' }}>
        <div
          className="h-3 w-3"
          style={{
            borderBottom: '1px solid',
            borderRight: '1px solid',
            borderColor: neonPink,
          }}
        />
      </div>

      {/* 主要内容 */}
      <div className="relative space-y-4">
        {/* 标题区域 */}
        <div className="text-center">
          <div className="inline-block">
            <span
              className="text-xs font-medium tracking-widest uppercase"
              style={{ color: neonCyan }}
            >
              Gaming Report
            </span>
          </div>
          <h2
            className="mt-1 text-2xl font-bold tracking-tight"
            style={{
              color: titleColor,
              textShadow: `0 0 10px ${neonCyan}40`,
            }}
          >
            我的游戏年度报告
          </h2>
          <div className="mt-2 flex items-center justify-center gap-2">
            <div
              className="h-px"
              style={{ width: '32px', backgroundColor: neonCyan }}
            />
            <span
              className="text-sm"
              style={{ color: titleColor, opacity: 0.6 }}
            >
              {displayYear}
            </span>
            <div
              className="h-px"
              style={{ width: '32px', backgroundColor: neonCyan }}
            />
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-2">
          <div
            className="rounded-lg p-3 text-center"
            style={{
              backgroundColor: 'rgba(0,245,255,0.1)',
              border: `1px solid ${neonCyan}30`,
            }}
          >
            <p className="text-xl font-bold" style={{ color: neonCyan }}>
              {displayData.totalHours}
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: titleColor, opacity: 0.7 }}
            >
              游戏时长(h)
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{
              backgroundColor: 'rgba(255,0,255,0.1)',
              border: `1px solid ${neonPink}30`,
            }}
          >
            <p className="text-xl font-bold" style={{ color: neonPink }}>
              {displayData.totalPlayCount}
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: titleColor, opacity: 0.7 }}
            >
              游玩次数
            </p>
          </div>
          <div
            className="rounded-lg p-3 text-center"
            style={{
              backgroundColor: 'rgba(0,245,255,0.1)',
              border: `1px solid ${neonCyan}30`,
            }}
          >
            <p className="text-xl font-bold" style={{ color: neonCyan }}>
              {displayData.averageRating}
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{ color: titleColor, opacity: 0.7 }}
            >
              平均评分
            </p>
          </div>
        </div>

        {/* 游戏封面 - Grid布局 */}
        {selectedGameInfo.includes('cover') && displayGames.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span
                className="text-xs font-medium tracking-wider uppercase"
                style={{ color: neonCyan }}
              >
                Top {displayGames.length}
              </span>
              <div
                className="h-px flex-1"
                style={{ backgroundColor: `${neonCyan}40` }}
              />
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
                  className="relative overflow-hidden rounded"
                  style={{
                    aspectRatio: '3/4',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
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
                        className="text-xs font-bold"
                        style={{ color: titleColor, opacity: 0.8 }}
                      >
                        {game.title.substring(0, 2)}
                      </span>
                    </div>
                  )}
                  <div
                    className="absolute right-0 bottom-0 left-0 p-1 text-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                  >
                    <span
                      className="text-xs font-bold"
                      style={{ color: neonCyan }}
                    >
                      {game.playtime}h
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详细信息 */}
        <div
          className="flex flex-wrap justify-center gap-3 rounded-lg p-3"
          style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
        >
          {selectedGameInfo.includes('playtime') && (
            <div className="text-center">
              <p
                className="text-xs"
                style={{ color: titleColor, opacity: 0.5 }}
              >
                游戏时长
              </p>
              <p className="font-bold" style={{ color: neonCyan }}>
                {displayData.totalHours}h
              </p>
            </div>
          )}

          {selectedGameInfo.includes('lastPlayed') && (
            <div className="text-center">
              <p
                className="text-xs"
                style={{ color: titleColor, opacity: 0.5 }}
              >
                最近游玩
              </p>
              <p className="font-bold" style={{ color: titleColor }}>
                {displayData.lastPlayedDate}
              </p>
            </div>
          )}

          {selectedGameInfo.includes('rating') && (
            <div className="text-center">
              <p
                className="text-xs"
                style={{ color: titleColor, opacity: 0.5 }}
              >
                评分
              </p>
              <p className="font-bold" style={{ color: neonPink }}>
                ⭐ {displayData.averageRating}
              </p>
            </div>
          )}

          {selectedGameInfo.includes('totalPlayCount') && (
            <div className="text-center">
              <p
                className="text-xs"
                style={{ color: titleColor, opacity: 0.5 }}
              >
                游玩次数
              </p>
              <p className="font-bold" style={{ color: titleColor }}>
                {displayData.totalPlayCount}次
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
