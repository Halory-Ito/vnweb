import dayjs from "dayjs";
import { int, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

// 游戏信息表
export const GameInfoTable = sqliteTable("game_info", {
  id: int().primaryKey({ autoIncrement: true }),
  date: text().notNull(), // 发布日期
  cover: text().default(""), // 封面图片
  icon: text().default(""), // 图标
  logo: text().default(""), // logo
  bg: text().default(""), // 背景图片
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
});

// 游戏 PV 表
export const GamePvTable = sqliteTable("game_pv", {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  name: text().notNull(), // pv名称
  url: text().notNull(), // pv链接地址
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 游戏 OST 表
export const GameOstTable = sqliteTable("game_ost", {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  name: text().notNull(), // ost名称
  url: text().notNull(), // ost链接地址
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 游戏游玩表
export const GamePlayTable = sqliteTable("game_play", {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  exePath: text().default(""), // 游戏可执行文件路径
  isRunning: int().default(0), // 是否正在计时，0否1是
  totalPlayTime: int().default(0), // 游戏游玩时间，单位为秒
  playCount: int().default(0), // 游戏游玩次数
  rating: int().default(0), // 游戏评分，0-10分
  lastLaunchedAt: text().default(""), // 上次游玩时间
  status: int().default(0), // 游戏状态，0未开始、1游玩中、2部分完成、3已完成、4多周目、5搁置中
});

// 游戏记录表
export const GameRecordTable = sqliteTable("game_record", {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  playTime: int().default(0), // 游戏游玩时间，单位为秒
  playDate: text().default(""), // 游戏游玩日期
});

// 游戏 id 与外部数据源 id 的映射表
export const GameIdMapTable = sqliteTable(
  "game_id_map",
  {
    id: int().primaryKey({ autoIncrement: true }),
    gameId: int().notNull(),
    provider: text().notNull(), // 数据源名称，如 vndb、steam、bgm 等
    externalId: text().notNull(), // 外部数据源的游戏 id
  },
  (table) => [
    uniqueIndex("game_id_map_game_provider_external_unique").on(
      table.gameId,
      table.provider,
      table.externalId,
    ),
  ],
);

// 游戏相关人物表
export const CharacterTable = sqliteTable(
  "character",
  {
    id: int().primaryKey({ autoIncrement: true }),
    gameId: int().notNull(),
    vndbId: text().notNull(), // VNDB 角色 id，例如 c123
    name: text().notNull(), // 角色名称
    original: text().default(""), // 角色原文名
    description: text().default(""), // 角色简介
    imageUrl: text().default(""), // 角色图片链接
    bloodType: text().default(""), // 血型
    height: int(), // 身高(cm)
    weight: int(), // 体重(kg)
    bust: int(), // 胸围(cm)
    waist: int(), // 腰围(cm)
    hips: int(), // 臀围(cm)
    age: int(), // 年龄
    birthdayMonth: int(), // 生日(月)
    birthdayDay: int(), // 生日(日)
    sex: text().default(""), // 生理性别信息(JSON)
    gender: text().default(""), // 社会性别信息(JSON)
    createdAt: text().default(dayjs().toString()), // 创建时间
    updatedAt: text().default(dayjs().toString()), // 更新时间
  },
  (table) => [
    uniqueIndex("character_game_vndb_unique").on(table.gameId, table.vndbId),
  ],
);

// 游戏回忆表
export const GameMemoryTable = sqliteTable("game_memory", {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  title: text().default(""), // 回忆标题
  description: text().default(""), // 回忆描述
  imageUrl: text().default(""), // 回忆图片链接
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 第三方账号表
export const ThirdPartyAccountTable = sqliteTable("third_party_account", {
  id: int().primaryKey({ autoIncrement: true }),
  provider: text().notNull(), // 第三方账号提供商，如 vndb、steam、bgm 等
  accountId: text().notNull(), // 第三方账号的唯一标识
  accessToken: text().notNull(), // 第三方账号的访问令牌
  refreshToken: text().default(""), // 第三方账号的刷新令牌
  expiresAt: text().notNull(), // 访问令牌过期时间
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 游戏相关网站表
export const relateWebsiteTable = sqliteTable("relate_website", {
  id: int().primaryKey({ autoIncrement: true }),
  gameId: int().notNull(),
  name: text().notNull(), // 链接名称
  url: text().notNull(), // 链接地址
});

// 收藏夹信息表
export const CollectionTable = sqliteTable("collection", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(), // 收藏夹名称
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 收藏夹关联游戏表
export const CollectionGameTable = sqliteTable("collection_game", {
  id: int().primaryKey({ autoIncrement: true }),
  collectionId: int().notNull(),
  gameId: int().notNull(),
});

// 扫描目录列表
export const ScannerTable = sqliteTable("scanner", {
  id: int().primaryKey({ autoIncrement: true }),
  directory: text().notNull(), // 目录路径
  provider: text().notNull(), // 数据源，与添加游戏的 provider 一致
  progress: int().default(0), // 扫描进度，0-100
  gameCount: int().default(0), // 扫描到的游戏数量
  scanMode: int().default(0), // 分为按照层级和按照可执行文件两种扫描方式，0层级扫描、1可执行文件扫描
  scanLevel: int().default(0), // 层级扫描深度，0 表示第一层子目录
  excludeDirs: text().default(""), // 扫描时排除的目录，逗号分隔
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 扫描失败表
export const ScanErrorTable = sqliteTable("scan_error", {
  id: int().primaryKey({ autoIncrement: true }),
  directory: text().notNull(), // 目录路径
  error: text().notNull(), // 错误信息
  status: int().default(0), // 错误状态，0未处理、1已修复
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});

// 代理配置表
export const ProxyConfigTable = sqliteTable("proxy_config", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(), // 配置名称
  type: text().notNull(), // 协议类型：http、https、socks5
  host: text().notNull(), // 代理服务器地址
  port: int().notNull(), // 代理服务器端口
  username: text().default(""), // 认证用户名（可选）
  password: text().default(""), // 认证密码（可选）
  enabled: int().default(0), // 是否启用，0否1是
  createdAt: text().default(dayjs().toString()), // 创建时间
  updatedAt: text().default(dayjs().toString()), // 更新时间
});
