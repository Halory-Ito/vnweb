import dayjs from 'dayjs'
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const usersTable = sqliteTable('users_table', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  age: int().notNull(),
  email: text().notNull().unique(),
})

// 游戏信息表
export const GameInfoTable = sqliteTable('game_info', {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(), // 发布日期
  cover: text().notNull(), // 封面图片
  icon: text().notNull(), // 图标
  logo: text().notNull(), // logo
  bg: text().notNull(), // 背景图片
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
