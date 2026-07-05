# 第三方联动

vnweb 支持接入 Steam、VNDB、Bangumi 等外部数据源，补全游戏信息与媒体资源。

## 支持的数据源

| 数据源          | 用途                               | 配置项                               |
| --------------- | ---------------------------------- | ------------------------------------ |
| **Steam**       | 获取游戏基本信息                   | `NEXT_PUBLIC_STEAM_API_KEY`          |
| **SteamGridDB** | 获取游戏封面、Logo、图标等媒体资源 | `NEXT_PUBLIC_STEAMGRIDDB_API_KEY`    |
| **VNDB**        | 获取视觉小说详细资料、角色信息     | `VNDB_OAUTH_TOKEN`                   |
| **Bangumi**     | 获取动漫/游戏评价与资料            | `NEXT_PUBLIC_BANGUMI_API_KEY`        |
| **网易云音乐**  | 获取 OST 曲目信息                  | `NETEASE_API_BASE`, `NETEASE_COOKIE` |

## 数据源映射

游戏 ID 与外部数据源 ID 的映射存储在 `game_id_map` 表中：

| 字段         | 说明                           |
| ------------ | ------------------------------ |
| `gameId`     | 本地游戏 ID                    |
| `provider`   | 数据源名称（vndb、steam、bgm） |
| `externalId` | 外部数据源的游戏 ID            |

通过唯一索引保证同一游戏与同一数据源只有一条映射。

## 第三方账号绑定

支持绑定第三方平台账号（存储在 `third_party_account` 表中）：

- 账号提供商
- 账号 ID
- Access Token / Refresh Token
- 用户名与头像
- Token 过期时间

## VNDB 集成

VNDB（The Visual Novel Database）是核心外部数据源，提供丰富的视觉小说数据：

- 游戏基本信息与简介
- 角色资料（名称、立绘、血型、身高体重、三围、生日、性别）
- 游戏媒体资源

VNDB API 客户端实现在 `lib/vndb-client.ts` 中。

## Steam 集成

- 获取游戏基本信息
- 通过 SteamGridDB 获取高质量封面、Logo、图标、背景图

## Bangumi 集成

支持 OAuth 认证：

- `BANGUMI_OAUTH_CLIENT_ID`
- `BANGUMI_OAUTH_CLIENT_SECRET`

## 配置方法

在 `app/config.ts` 中填入对应平台的 API Key，详见 [安装与配置](/guide/installation#第三方平台配置)。
