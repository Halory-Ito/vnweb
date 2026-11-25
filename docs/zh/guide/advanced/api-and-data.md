# API 与数据层

本页说明 vnweb 的请求封装规范、服务端路由约定、数据库表结构与迁移脚本。所有内容以源码（`AGENTS.md`、`api/`、`app/api/`、`db/schema.ts`、`package.json`）为准。

## API 两层封装规范

客户端请求分两层，避免把服务端细节散落在组件里：

| 层级         | 位置                      | 适用请求                                                               | 出口                           |
| ------------ | ------------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| 根级领域请求 | `api/`                    | 跨模块共用，如 `game`、`character`、`quote`、`ost`、`pv`、`collection` | `api/index.ts` 统一 `export *` |
| 模块内请求   | `features/xxx/xxx-api.ts` | 仅本模块使用，如 `features/guide/guide-api.ts`                         | 模块 `index.ts(x)`             |

领域类型同样分两层：跨模块类型放 `types/`（如 `types/game.ts`、`types/backup.ts`），由 `types/index.ts` 出口；仅模块内使用的类型可留在模块内。

`api/index.ts` 当前出口的域包括：`agent`、`character`、`collection`、`game`、`goals`、`media`、`memory`、`ost`、`pv`、`quote`、`recent-visit`、`record`、`system`、`status-settings`、`game-status-sync`。

### 请求实例

`lib/request-utils.ts` 创建一个统一的 axios 实例：

```ts
import axios from 'axios'

export const api = axios.create({
  baseURL: `/api`,
  timeout: undefined,
  proxy: false,
})
```

所有请求都通过它发起，路径写成 `/game/...`、`/quote/...` 等相对 `/api` 的地址。AGENTS.md 规定了统一的 axios 写法：

```ts
export function actionObjectApi() {
  return api.request({
    method: 'method',
    url: 'url',
  })
}
```

实际代码中也常见 `api.get`、`api.post`、`api.patch` 等简写，但都基于同一个实例。

::: danger 不要在组件中直接 fetch
组件只通过 API 层 + react-query 访问数据。唯一例外是 `api/agent.ts` 的 SSE 流式对话：浏览器端 axios 无法逐块读取响应体，于是用 `fetch` + `ReadableStream` 封装在 API 层内部，组件仍然不直接调用 `fetch`。
:::

## react-query 用法

服务端状态由 `@tanstack/react-query` 管理。典型模式：

```ts
const { data, isLoading, error } = useQuery({
  queryKey: ['game', gameId],
  queryFn: () => getGameById(gameId),
})
```

- `queryKey` 应包含领域与参数，便于精确失效。
- 变更后用 `queryClient.invalidateQueries({ queryKey: ['game'] })` 刷新相关列表。
- 配合骨架屏、静默刷新与空状态，见 `DESIGN.md` 的状态反馈规范。
- 客户端 UI 状态（如弹窗开关、选择集）用 Jotai，不塞进 query cache。

## 服务端路由约定

`app/api/` 下每个模块用 `route.ts` 提供服务端实现，通过导出的 HTTP 动词函数响应请求：

| 文件                            | 职责示例                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------- |
| `app/api/game/route.ts`         | 创建游戏（导出 `POST`），归一化字段、写 `game_info` 与 ID 映射、PV、关联网站 |
| `app/api/character/route.ts`    | 角色数据                                                                     |
| `app/api/guide/route.ts`        | 攻略搜索、导入、批量删除                                                     |
| `app/api/ost/route.ts`          | OST 搜索与导入                                                               |
| `app/api/pv/route.ts`           | PV 元数据                                                                    |
| `app/api/quote/route.ts`        | 台词摘录                                                                     |
| `app/api/collection/route.ts`   | 收藏夹                                                                       |
| `app/api/recent-visit/route.ts` | 最近访问                                                                     |
| `app/api/proxy-image/route.ts`  | 远程图片代理                                                                 |
| `app/api/agent/_shared.ts`      | Agent 路由共享逻辑（非路由文件）                                             |

动态子路由按目录层级组织，例如 `/api/game/:id`、`/api/guide/:gameId/progress`。

响应约定：

```ts
// 成功
return NextResponse.json({ data: { id: gameId } })

// 失败
return NextResponse.json({ error: 'Invalid game info payload' }, { status: 400 })
```

::: tip 字段归一化
路由是外部输入与数据库之间的边界。`app/api/game/route.ts` 里的 `parseGameInfoPayload` 会把数组字段 join 成逗号分隔字符串、把布尔值转成 0/1，再交给 Drizzle 写入。不要把这类转换放在组件里。
:::

## Zod 校验

项目用 Zod `^4.3.6` 做结构校验，典型场景：

1. **攻略导入**：`features/guide/import-guide-schema.ts` 定义 `guideJsonSchema`，约束 `name['zh-cn']`、`routes`、`endings`、`steps` 必填，步骤类型为 `choice | save | load | note`，结局类型为 `normal | bad | good | true`，`level` 为 0–5 整数。`validateGuideJson()` 解析后返回统一形状。
2. **WebMCP 工具参数**：每个工具都有独立 schema 文件，如 `webmcp/game/lib/add-game-tool-schema.ts`。
3. **配置读取**：设置文件读取时会校验字段类型与端口范围，避免错误配置导致启动失败。

```ts
const guideStepSchema = z.object({
  type: z.enum(['choice', 'save', 'load', 'note']).optional(),
  content: z.string().min(1, '步骤 content 不能为空'),
  group: z.string().optional(),
  prefix: z.string().optional(),
  subfix: z.string().optional(),
})
```

## 数据库与 Drizzle

连接由 `lib/drizzle.ts` 创建，使用 libSQL 驱动：

```ts
import { drizzle } from 'drizzle-orm/libsql'
import { databaseUrl, getDbPath } from './server/database-config.mjs'

if (databaseUrl.startsWith('file:') && !databaseUrl.includes(':memory:')) {
  fs.mkdirSync(path.dirname(getDbPath()), { recursive: true })
}

export const db = drizzle({ connection: { url: databaseUrl } })
```

默认数据库地址是 `file:./local.db`，可在 `data/settings/general.json` 的 `dbFileName` 中修改，重启后生效。

### 表结构速查

`db/schema.ts` 中的表按领域分组如下：

| 领域       | 表                                    | 说明                                                                    |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------- |
| 游戏主体   | `game_info`                           | 名称、简介、标签、开发商、封面/背景/图标/Logo、存档目录、时间戳         |
| 游戏扩展   | `game_id_map`                         | 本地游戏与外部平台 ID 映射，含唯一索引 `(gameId, provider, externalId)` |
|            | `relate_website`                      | 游戏相关网站链接                                                        |
|            | `cg`                                  | CG 图片、分类、尺寸、来源、排序                                         |
| 媒体       | `game_pv` / `game_pv_metadata`        | PV 地址与 JSON 元数据（外键级联删除）                                   |
|            | `game_ost` / `game_ost_songs`         | OST 专辑与曲目、歌词文本/路径、来源                                     |
| 角色与文本 | `character`                           | 角色档案与立绘，`(gameId, vndbId)` 唯一                                 |
|            | `game_quote`                          | 台词摘录，含 `characterId`、`context`                                   |
|            | `game_memory`                         | 回忆条目（正文由 MDX 文件承载）                                         |
| 攻略       | `game_guide`                          | 攻略主体、难度、提示、完成标记                                          |
|            | `guide_route`                         | 路线，`sortOrder` 用于拖拽排序                                          |
|            | `guide_ending`                        | 结局，类型 `normal/bad/true`，含开启条件与 CG                           |
|            | `guide_step`                          | 步骤，类型、分组、前后缀、完成标记                                      |
| 游玩       | `game_play`                           | 可执行路径、是否运行、累计秒数、次数、评分、状态、PID                   |
|            | `game_record`                         | 单次游玩时长与日期                                                      |
|            | `game_status` / `game_status_mapping` | 状态自定义与平台状态映射                                                |
|            | `game_status_push`                    | 每款游戏每平台的推送记录，主键 `(gameId, provider)`                     |
| 库管理     | `collection` / `collection_game`      | 收藏夹及关联游戏                                                        |
|            | `scanner` / `scan_error`              | 扫描目录配置、进度、排除规则与失败记录                                  |
|            | `library_folder_logo`                 | 文件夹品牌图标映射                                                      |
| 账号与访问 | `third_party_account`                 | 第三方账号令牌、用户名、头像、过期时间                                  |
|            | `recent_visit`                        | 最近访问，同一游戏 + 入口类型只保留一条                                 |

时间戳字段普遍使用 `.$defaultFn(() => dayjs().toString())` 生成默认值；列表型字段（标签、别名、平台）以逗号分隔文本存储，读出后再拆分。

### 迁移脚本

以 `package.json` 的 scripts 为准：

| 命令                  | 实际执行                                          | 用途                              |
| --------------------- | ------------------------------------------------- | --------------------------------- |
| `npm run db:generate` | `drizzle-kit generate`                            | 根据 schema 生成迁移 SQL          |
| `npm run db:push`     | `drizzle-kit push`                                | 直接把 schema 同步到数据库        |
| `npm run db:init`     | `drizzle-kit push`                                | 初始化数据库（与 `db:push` 等价） |
| `npm run db:migrate`  | `tsx cmd/migrate-db.ts`                           | 执行迁移脚本                      |
| `npm run db:studio`   | `drizzle-kit studio --port 5123 --host 127.0.0.1` | 打开可视化数据库管理界面          |

迁移基线位于 `drizzle/0000_initial.sql`，元数据在 `drizzle/meta/`。服务端启动（`instrumentation.ts`）与 CLI 启动都会自动补齐配置并执行迁移，兼容存量 `local.db` 接管与新库创建。

::: warning 已有数据库
`init.bat` 会先把已有数据库及 `-wal` / `-shm` / `-journal` 备份到 `backups/db/`，再重建空库。执行任何会重建数据库的操作前，先关闭 vnweb 与 Drizzle Studio，并另存备份。
:::

## 配置与数据边界

- 平台凭证：`data/settings/platform.json`，模板见 `data/example/platform.json`。
- 外观设置：`data/settings/appearance.json`，模板见 `data/example/appearance.json`。
- 通用设置：`data/settings/general.json`，含 `dbFileName`、`agent`、`goals`。
- 备份设置：`data/settings/backup.json`。
- 自定义主题：`custom.css`；应用目录与数据目录分离时位于数据目录的 `settings/` 下。

这些文件都参与[备份与同步](/zh/guide/feats/save-backup)。本地路径统一由 `lib/server/runtime-paths.mjs` 收口，避免散落的 `process.cwd()`。

## 延伸阅读

- [架构总览](/zh/guide/advanced/architecture) · [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)
- [贡献指南](/zh/guide/advanced/contributing) · [术语表](/zh/guide/advanced/glossary)
- [攻略与路线进度](/zh/guide/feats/walkthroughs) · [常见问题](/zh/guide/advanced/faq)
