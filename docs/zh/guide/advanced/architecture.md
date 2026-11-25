# 架构总览

本页从源码视角说明 vnweb 的技术栈、分层结构、请求流转、渲染与状态管理，以及 Web / CLI / 桌面端三种入口如何共享同一份数据。具体 API 写法见 [API 与数据层](/zh/guide/advanced/api-and-data)，平台接入细节见[平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)。

## 技术栈全景

版本以 `package.json` 为准（当前 `0.2.2`）。

| 分类       | 技术                                  | 版本 / 说明                                                                             |
| ---------- | ------------------------------------- | --------------------------------------------------------------------------------------- |
| 框架       | Next.js                               | `^16.4.5`，App Router + Turbopack，`output: 'standalone'`                               |
| UI         | React / React DOM                     | `19.2.3`                                                                                |
| 语言       | TypeScript                            | `^5.9.3`，`strict: true`，路径别名 `@/*`                                                |
| 样式       | Tailwind CSS                          | `^4.3.3` + `@tailwindcss/postcss`，`tw-animate-css`                                     |
| 组件库     | shadcn/ui                             | `radix-ui`、`@base-ui/react`、`class-variance-authority`，`components/ui` 下有 50+ 组件 |
| 图标与图表 | Lucide、Recharts                      | `lucide-react`、`recharts`                                                              |
| 动效       | Motion                                | `motion`                                                                                |
| 数据库     | SQLite（libSQL）+ Drizzle ORM         | `@libsql/client`、`drizzle-orm ^0.45.1`，`drizzle-kit` 管理迁移                         |
| 服务端状态 | TanStack Query                        | `@tanstack/react-query ^5.90.21`                                                        |
| 客户端状态 | Jotai                                 | `jotai ^2.18.0`                                                                         |
| HTTP       | axios                                 | `^1.13.5`，统一封装为 `api` 实例                                                        |
| 校验       | Zod                                   | `^4.3.6`，用于攻略导入、工具参数等                                                      |
| 媒体       | hls.js、`@meting/core`、ExcelJS       | 视频播放、OST 读取、XLSX 导出                                                           |
| 文本渲染   | MDX / react-markdown                  | `next-mdx-remote`、`remark-gfm`、`rehype-highlight`                                     |
| 同步       | webdav、`@aws-sdk/client-s3`          | 远程备份                                                                                |
| Agent      | `usewebmcp`、`@mcp-b/webmcp-polyfill` | WebMCP 注册与兜底                                                                       |
| CLI        | `commander`                           | `^14.0.3`，入口 `cmd/tui.ts`                                                            |
| 桌面端     | Tauri v2 + Rust                       | `crates/vnweb-cli`、`crates/vnweb-desktop`，Cargo workspace                             |
| 工程工具   | oxlint / oxfmt / VitePress / tsx      | 跳过 Vitest 测试                                                                        |

## 分层架构

```text
浏览器 / Tauri WebView
        │
        ▼
app/            路由与页面（App Router，layout / page / loading）
        │
        ▼
features/       模块视图 views、组件 components、逻辑 hooks
        │
        ▼
api/ (或 features/xxx/xxx-api.ts)   客户端请求封装
        │
        ▼
lib/request-utils.ts  axios 实例（baseURL: /api）
        │  HTTP
        ▼
app/api/**/route.ts  服务端路由（NextRequest → NextResponse）
        │
        ▼
lib/server/*         服务端服务、配置读写、备份、平台调用
        │
        ▼
db/schema.ts         Drizzle schema
        │
        ▼
SQLite / libSQL（local.db 或 general.json 指定路径）
```

横切关注点：

- `types/`：跨模块领域类型，按域拆分并由 `types/index.ts` 统一出口。
- `components/ui/`：shadcn/ui 风格的基础组件，任何模块复用。
- `lib/providers/`：外部平台 provider 注册表与实现。
- `lib/settings/`：设置文件读写与默认值。
- `webmcp/`：工具定义、schema 与生成式 UI 组件。
- `crates/`、`cmd/`、`scripts/`：原生入口与构建脚本。

## 目录职责

| 目录            | 职责                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app`           | Next.js App Router 页面与 `app/api` 服务端路由；`custom.css`、`default.css`、`globals.css`                                                                            |
| `api`           | 根级跨模块请求层，按域拆分：`game`、`character`、`collection`、`quote`、`ost`、`pv`、`agent`、`record` 等，入口 `index.ts`                                            |
| `types`         | 根级跨模块类型层：`game`、`character`、`backup`、`agent`、`record-types` 等，入口 `index.ts`                                                                          |
| `features`      | 16 个业务模块：`agent`、`appearance`、`backup`、`cg`、`character`、`dashboard`、`game`、`guide`、`home`、`ost`、`pv`、`quote`、`recent`、`record`、`scan`、`settings` |
| `lib`           | 通用工具：`providers`、`server`、`settings`、`sync-client`、`drizzle.ts`、`request-utils.ts` 等                                                                       |
| `components/ui` | shadcn/ui 基础组件，如 `button`、`dialog`、`table`、`tabs`、`chart`                                                                                                   |
| `db`            | `schema.ts`，Drizzle 表定义                                                                                                                                           |
| `drizzle`       | 迁移 SQL 与元数据（`0000_initial.sql`、`meta/`）                                                                                                                      |
| `cmd`           | CLI：`tui.ts`、`migrate-db.ts`、`init-settings.ts`                                                                                                                    |
| `webmcp`        | 按模块组织工具：`game`、`guide`、`ost`、`quote` 与共享 `lib`                                                                                                          |
| `crates`        | Rust：原生 CLI 入口与 Tauri 桌面壳                                                                                                                                    |
| `scripts`       | `build-cli.mjs`、`build-standalone.mjs`、`run-tauri.mjs`、`prepare-tauri-resources.mjs`                                                                               |
| `docs`          | VitePress 中文文档；英文站镜像到 `/en/`                                                                                                                               |

每个 `features/xxx` 模块按规范包含 `hooks`、`components`、`data`、`views`、`lib` 与模块出口文件。仅模块内使用的请求放 `features/xxx/xxx-api.ts`，仅模块内使用的类型可留在模块内。

## 请求流转

以「读取游戏详情」为例：

```ts
// api/game.ts：客户端封装
export const getGameById = async (id: string) => {
  const response = await api.get(`/game/${id}`)
  return (response.data as { data: GameDetail }).data
}
```

1. 组件通过 hook 调用 `getGameById`，通常包在 `useQuery` 中。
2. `api` 实例来自 `lib/request-utils.ts`：`baseURL: '/api'`、`proxy: false`。
3. Next.js 将 `/api/game/:id` 交给对应的 `app/api/game/.../route.ts`。
4. 服务端用 Drizzle 查询 `db/schema.ts` 定义的表，并包装为 `{ data: ... }` 返回。
5. 异常由路由捕获并返回 `{ error }` 与非 2xx 状态码，前端在使用处处理错误边界。

服务端路由示例（取自 `app/api/game/route.ts` 的创建游戏逻辑）：

```ts
export { createGame as POST }

async function createGame(req: NextRequest) {
  const body = await req.json()
  // 校验并归一化字段 → db.insert(GameInfoTable) → 写 ID 映射 / PV / 关联网站
  return NextResponse.json({ data: { id: gameId } })
}
```

::: warning 不要在组件里直接 fetch
项目规范明确禁止组件直接调用 `fetch`。唯一例外是 `api/agent.ts` 中的 SSE 流式对话：浏览器端 axios 无法逐块读取响应体，因此在 API 层使用 `fetch` + `ReadableStream` 封装。
:::

## 渲染与状态管理

- **路由与布局**：`app/layout.tsx` 提供全局外壳；`app/game/layout.tsx`、`app/settings/layout.tsx` 等提供模块级布局。`app/page.tsx` 是主页仪表盘。
- **页面拆分**：较大的页面把视图放到 `features/xxx/views`，把交互逻辑抽到 `features/xxx/hooks`，组件只负责渲染。
- **服务端状态**：TanStack Query 管理请求缓存与失效；配合骨架屏、静默刷新与空状态。
- **客户端状态**：Jotai 管理跨组件 UI 状态；`next-themes` 管理明暗模式。
- **错误边界**：关键区域需要错误边界，避免局部失败导致整页崩溃。
- **渲染性能**：避免一个小地方变化引发整页重渲染；背景与外观同步做了渲染隔离，导航与详情标签切换会复用布局。
- **样式约束**：单组件不超过 200 行，超过 150 行考虑拆分；优先 shadcn/ui outlined 风格；响应式布局与 `--app-font-family` 全局字体。详见[外观与主题](/zh/guide/feats/custom-theme)。

## 启动、迁移与运行时路径

`instrumentation.ts` 在服务端启动时调用初始化逻辑：补齐缺失设置文件并执行数据库迁移，兼容存量 `local.db` 接管与新库创建。CLI 启动时也走同一套 bootstrap。

路径由 `lib/server/runtime-paths.mjs` 统一收口：

| 变量             | 含义                               | 默认值          |
| ---------------- | ---------------------------------- | --------------- |
| `VNWEB_APP_DIR`  | 应用目录（代码、standalone 产物）  | `process.cwd()` |
| `VNWEB_DATA_DIR` | 用户数据目录（设置、资源、数据库） | `process.cwd()` |

由此派生出 `data/settings`、`data/example`、`assets`、`public`、`temp-backup`、`custom.css` 等路径。应用目录与数据目录分离时，`custom.css` 位于数据目录的 `settings/` 下。

## Tauri / CLI 入口

```text
安装目录
├── vnweb.exe            原生入口（Rust）
├── vnweb-desktop.exe    Tauri 桌面壳
├── runtime/node.exe     内嵌 Node 运行时
└── standalone/
    ├── server.js        Next.js standalone 服务端
    ├── cli/vnweb-cli.mjs 独立 CLI bundle
    ├── .next/           页面与静态资源
    ├── data/            设置示例与运行数据
    └── drizzle/         迁移文件
```

- 无参数：`vnweb.exe` 优先拉起桌面端；桌面端分配端口、探活服务端后展示窗口。
- 带参数：转发给 `vnweb-cli.mjs`，命令见[命令行工具](/zh/guide/feats/other)。
- Tauri 侧还实现单实例锁、系统托盘、Windows Job Object 子进程托管，以及外部链接交给系统浏览器。
- NSIS 安装/卸载钩子负责维护用户 `PATH`。

## 构建产物

| 脚本                       | 产物                                                             |
| -------------------------- | ---------------------------------------------------------------- |
| `npm run build`            | `.next/`，`output: 'standalone'` 模式                            |
| `npm run build:cli`        | `dist/cli/vnweb-cli.mjs`                                         |
| `npm run build:standalone` | `.next/standalone`，裁剪私有数据并补入 CLI、静态资源、示例与迁移 |
| `npm run tauri:build`      | Windows x64 NSIS 安装包                                          |

`next.config.ts` 的 `outputFileTracingExcludes` 会排除 `.git`、`docs`、`crates`、`target`、`local.db*` 等目录，减小产物体积；同时允许任意域名的远程图片，便于加载平台封面。`/game` 会重定向到 `/game/home`。

## 延伸阅读

- [什么是 vnweb](/zh/guide/intro/what-is-vnweb) · [安装与配置](/zh/guide/intro/installation-and-configuration)
- [API 与数据层](/zh/guide/advanced/api-and-data) · [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)
- [贡献指南](/zh/guide/advanced/contributing) · [术语表](/zh/guide/advanced/glossary)
