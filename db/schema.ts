import dayjs from 'dayjs'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

// 游戏信息表
export const GameInfoTable = sqliteTable('game_info', {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(), // 发布日期
  cover: text().default(''), // 封面图片
  icon: text().default(''), // 图标
  logo: text().default(''), // logo
  bg: text().default(''), // 背景图片
  pv: text().default(''), // 宣传视频链接
  summary: text().notNull(), // 游戏简介
  name: text().notNull(), // 游戏名称
  nameCn: text().notNull(), // 游戏中文名称
  tags: text().notNull(), // 游戏标签，逗号分隔
  nsfw: int().notNull(), // 是否包含成人内容，0或1
  ailases: text().notNull(), // 游戏别名，逗号分隔
  platforms: text().notNull(), // 游戏平台，逗号分隔
  gameType: text().notNull(), // 游戏类型
  gameEngine: text().notNull(), // 游戏引擎
  music: text().notNull(), // 音乐制作
  script: text().notNull(), // 剧本创作
  graphic: text().notNull(), // 美术设计
  originalPainter: text().notNull(), // 原画
  animationProduction: text().notNull(), // 动画制作
  developer: text().notNull(), // 开发商
  publisher: text().notNull(), // 发行商
  programmer: text().notNull(), // 程序制作
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
})

// 游戏游玩表
export const GamePlayTable = sqliteTable('game_play', {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  exePath: text().default(''), // 游戏可执行文件路径
  isRunning: int().default(0), // 是否正在计时，0否1是
  totalPlayTime: int().default(0), // 游戏游玩时间，单位为秒
  playCount: int().default(0), // 游戏游玩次数
  rating: int().default(0), // 游戏评分，0-10分
  lastLaunchedAt: text().default(''), // 上次游玩时间
  status: int().default(0), // 游戏状态，0未开始、1游玩中、2部分完成、3已完成、4多周目、5搁置中
})

// 游戏记录表
export const GameRecordTable = sqliteTable('game_record', {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  playTime: int().default(0), // 游戏游玩时间，单位为秒
  playDate: text().default(''), // 游戏游玩日期
})

// 游戏相关网站表
export const relateWebsiteTable = sqliteTable('relate_website', {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  name: text().notNull(), // 链接名称
  url: text().notNull(), // 链接地址
})

// 收藏夹信息表
export const CollectionTable = sqliteTable('collection', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(), // 收藏夹名称
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
})

// 收藏夹关联游戏表
export const CollectionGameTable = sqliteTable('collection_game', {
  id: int().primaryKey({ autoIncrement: true }),
  collectionId: int().notNull(),
  gameId: int().notNull(),
})

// 扫描目录列表
export const ScannerTable = sqliteTable('scanner', {
  id: int().primaryKey({ autoIncrement: true }),
  directory: text().notNull(), // 目录路径
  provider: text().notNull(), // 数据源，与添加游戏的 provider 一致
  progress: int().default(0), // 扫描进度，0-100
  gameCount: int().default(0), // 扫描到的游戏数量
  scanMode: int().default(0), // 分为按照层级和按照可执行文件两种扫描方式，0层级扫描、1可执行文件扫描
  scanLevel: int().default(0), // 层级扫描深度，0 表示第一层子目录
  excludeDirs: text().default(''), // 扫描时排除的目录，逗号分隔
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
})

// 扫描失败表
export const ScanErrorTable = sqliteTable('scan_error', {
  id: int().primaryKey({ autoIncrement: true }),
  directory: text().notNull(), // 目录路径
  error: text().notNull(), // 错误信息
  status: int().default(0), // 错误状态，0未处理、1已修复
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
})
