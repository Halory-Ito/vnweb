# 平台接入与 WebMCP

vnweb 通过一组可插拔的 provider 从外部平台补全作品资料、角色、图片、PV 与 OST，并把游玩状态推送回部分平台。本页说明 provider 注册机制、ID 映射、元数据合并、缓存策略，以及这些能力如何暴露给 WebMCP 工具。使用前请在「设置 → 平台」完成配置，具体操作见[平台接入与资料更新](/zh/guide/feats/platforms)。

## Provider 总览

注册表位于 `lib/providers/registry.ts`，当前包含 5 个游戏 provider：

| Provider ID   | 名称        | 能力                                           | 主要用途                                        |
| ------------- | ----------- | ---------------------------------------------- | ----------------------------------------------- |
| `bangumi`     | Bangumi     | `manual-search`、`bulk-import`、`account-bind` | 条目搜索、账号收藏导入、状态推送、个人令牌绑定  |
| `steam`       | Steam       | `manual-search`、`bulk-import`                 | 游戏搜索、已有游戏导入、预告片同步、OpenID 绑定 |
| `steamgriddb` | SteamGridDB | `manual-search`                                | 封面、背景、图标、Logo 图片                     |
| `vndb`        | VNDB        | `manual-search`、`bulk-import`、`account-bind` | 作品与角色资料、状态推送                        |
| `ymgal`       | YMGal       | `manual-search`、`bulk-import`、`account-bind` | 国产 Galgame 资料与角色                         |

角色 provider 单独注册，当前有 `vndb`、`bangumi`、`ymgal` 三个，见[角色、摘录与回忆](/zh/guide/feats/game-notes)。

### 接口约定

游戏 provider 实现 `GameProvider`：

```ts
export interface GameProvider {
  id: string
  name: string
  description: string
  version: string
  icon: string
  type: 'provider'
  defaultEnabled: boolean
  capabilities: ProviderCapability[]
  accountProviderId?: string

  searchByName?(keyword: string, offset: number, limit: number): Promise<GameSearchResult>
  getById?(id: string): Promise<GameInfo | null>
  searchCollection?(): Promise<BulkImportResult>
  searchByUid?(uid: string): Promise<{ total: number; items: SteamOwnedGameItem[] }>
  importOneByUid?(payload: {
    /* appid、名称、图片等 */
  }): Promise<{ status: 'imported' | 'skipped' }>
}
```

能力常量有三种：`manual-search`（手动搜索导入）、`bulk-import`（账号库批量导入）、`account-bind`（账号绑定与状态推送）。注册表据此提供 `getManualSearchProviderOptions()`、`getBulkImportProviders()`、`getAccountBindProviders()` 等查询函数。

角色 provider 实现 `CharacterProvider`，关键方法是：

```ts
interface CharacterProvider {
  sourceId: string
  normalizeExternalId(rawId: string): string
  resolveExternalId(gameId: number): Promise<string | null>
  fetchCharacters(ctx: {
    gameId: number
    externalId: string
    saveImagesToLocal: boolean
    now: string
  }): Promise<NormalizedCharacterRow[]>
}
```

外部 ID 会被归一化（例如 `subject/456` → `456`），再解析为统一行结构写入 `character` 表。

## 平台配置

配置统一保存在 `data/settings/platform.json`，模板见 `data/example/platform.json`。主要字段：

| 平台         | 字段                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Steam        | `apiKey`                                                                                                                              |
| Bangumi      | `useMirror`、`mirrorUrl`、`baseUrl`、`tokenUrl`                                                                                       |
| VNDB         | `baseUrl`、`oauthToken`、`oauthClientId`、`oauthClientSecret`、`oauthAuthorizeUrl`、`oauthTokenUrl`、`oauthUserInfoUrl`、`oauthScope` |
| YMGal        | `baseUrl`、`clientId`、`clientSecret`、`oauthClientId`、`oauthClientSecret`                                                           |
| SteamGridDB  | `apiKey`、`baseUrl`                                                                                                                   |
| Meting       | `bitrate`、`coverSize`、`neteaseCookie`                                                                                               |
| Enhanced API | `useLocalSdk`、`apiBase`、`musicU`、`quality`、`sdkPort`                                                                              |

::: warning 配置写入行为
平台配置串行保存并原子替换文件，避免并发覆盖。保存前会校验字段类型与端口范围；读取失败时会显示错误与重试入口，并保留无法读取的配置文件，不要直接删除它。
:::

近期调整包括：Bangumi 改用个人令牌绑定并移除 OAuth 配置与授权接口；Bangumi 令牌获取地址支持镜像配置；VNDB 移除 OAuth 对环境变量的依赖，并合并重复的 Token 配置入口；平台配置调用统一迁移到 `platform.json`；平台显示开关按用途分组并持久化。各平台凭据页面提供官方获取入口与用途提示面板。

## ID 映射机制

本地游戏与外部平台条目之间靠 `game_id_map` 表连接：

```sql
game_id_map
  id          INTEGER PRIMARY KEY AUTOINCREMENT
  gameId      INTEGER NOT NULL
  provider    TEXT    NOT NULL   -- vndb / steam / bgm / ...
  externalId  TEXT    NOT NULL   -- 平台侧 ID

UNIQUE INDEX game_id_map_game_provider_external_unique
  ON (gameId, provider, externalId)
```

流程：

1. 通过平台搜索导入游戏时，写入一条或多条映射记录。
2. 游戏详情中的 `externalSourceIds` 也会保留外部 ID 字符串。
3. 同步角色、PV 或推送状态时，先按 `(gameId, provider)` 解析外部 ID，再调用对应 provider。
4. `api/game.ts` 的 `resolveGameIdApi` 可按中文名、原名、别名或 VNDB ID 在本地库中反查游戏。

这层映射让用户既能从游戏找到平台条目，也能从平台条目回到本地游戏。

## 元数据合并

批量更新元数据走 `POST /api/game/metadata-batch`，请求形状大致为：

```ts
{
  gameIds: [1, 2, 3],
  provider: 'bangumi' | 'steamgriddb',
  fields: ['cover', 'bg', 'developer', 'tags'],
  strategy: 'replace' | 'merge' | 'append',
}
```

| 策略      | 行为                                 |
| --------- | ------------------------------------ |
| `replace` | 用平台值整体替换本地字段             |
| `merge`   | 合并平台与本地值（适合简介、标签等） |
| `append`  | 追加到现有列表（适合标签、别名）     |

可更新字段包括 `date`、`cover`、`icon`、`logo`、`bg`、`summary`、`name`、`nameCn`、`tags`、`nsfw`、`ailases`、`platforms`、`gameType`、`gameEngine`、`music`、`script`、`graphic`、`originalPainter`、`animationProduction`、`developer`、`publisher`、`programmer`。返回 `updatedCount`、`skippedCount`、`failedCount` 便于核对结果。

图片来源方面，SteamGridDB 提供封面、背景、图标与徽标；VNDB 封面可在浏览器直接加载。远程图片支持任意域名，`next.config.ts` 的 `images.remotePatterns` 允许 http/https 任意主机；远程下载使用 Fetch adapter 实现。

### 状态推送

游玩状态可以同步到 Bangumi 与 VNDB：

- 在平台设置中配置**多对一状态映射**，把本地状态对应到平台状态值。
- 切换游玩状态时立即保存，支持按平台手动同步并显示进度。
- 每台游戏的推送记录写入 `game_status_push`，主键为 `(gameId, provider)`，记录目标状态与推送时间。
- 外观设置可自定义四种推送状态的指示点颜色。

详见[启动与游玩记录](/zh/guide/feats/play-records)。

## 缓存与速率限制

- 平台设置优先读取浏览器缓存，缓存缺失时再读服务端，减少重复请求。
- 远程图片按需加载，避免一次性拉取全部素材。
- 批量导入与批量元数据更新会逐个处理目标，受上游接口可用性影响；遇到失败时查看返回的 `failedCount` 与服务端日志。
- 上游服务各有速率限制，请避免高频重复触发全库同步；必要时分批选择游戏。
- 平台读取错误会显示重试入口，可先检查凭证与网络再重试。

## WebMCP 工具映射

WebMCP 工具把上述 provider 能力暴露给模型。工具定义位于 `webmcp/`，每个工具有独立 Zod schema，并通过 `ensureWebMcpRuntime()` 保证运行时可用。

| 工具                   | 依赖的 provider / 数据                         |
| ---------------------- | ---------------------------------------------- |
| `add_game_to_library`  | 平台搜索 + SteamGridDB 图片                    |
| `sync_game_characters` | VNDB / Bangumi / YMGal 角色 provider + ID 映射 |
| `sync_game_pv`         | Steam 预告片；未绑定时按名称搜索候选           |
| `search_game_ost`      | khinsider / 网易云来源                         |
| `import_game_ost`      | OST 专辑与曲目数据                             |
| `import_game_guide`    | 攻略 JSON 结构校验                             |
| `export_quotes_xlsx`   | 台词摘录表                                     |

`sync_game_pv` 在未绑定平台条目时会渲染候选卡片供点选；工具确认后才写入。完整用法见 [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)。

## 排错

| 现象                | 处理方式                                                     |
| ------------------- | ------------------------------------------------------------ |
| 搜索不到平台条目    | 检查 API Key / Token；确认 `baseUrl` 正确；换用其他关键词    |
| Bangumi 导入失败    | 确认使用个人令牌；如使用镜像，检查 `mirrorUrl` 与 `tokenUrl` |
| VNDB Token 权限不足 | 检查 Token 的写入权限范围（读取类操作不需要写权限）          |
| 角色同步为空        | 核对 `game_id_map` 中的外部 ID；确认该平台有角色数据         |
| 图片加载失败        | 检查网络与图床；尝试本地化图片；查看远程图片代理             |
| 状态推送没有生效    | 检查多对一映射与 `game_status_push` 记录；手动重试同步       |
| 平台配置读取报错    | 不要删除损坏的配置文件；按界面提示修复或重新填写后保存       |

## 延伸阅读

- [架构总览](/zh/guide/advanced/architecture) · [API 与数据层](/zh/guide/advanced/api-and-data)
- [贡献指南](/zh/guide/advanced/contributing) · [术语表](/zh/guide/advanced/glossary)
- [平台接入与资料更新](/zh/guide/feats/platforms) · [角色、摘录与回忆](/zh/guide/feats/game-notes)
