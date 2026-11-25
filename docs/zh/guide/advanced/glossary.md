# 术语表

本表汇总 vnweb 文档与源码中高频出现的概念。点击「相关页面」可跳转到详细说明。

## 如何使用本表

- 按主题分为五组：**作品与玩法**、**资料与平台**、**工程技术**、**Agent 与数据**、**备份与桌面端**。
- 「英文 / 别名」列给出源码中常见的字段名、接口名或平台称呼，方便从文档跳转到代码检索。
- 同一个概念可能在不同页面出现，表格只链接最相关的一处；完整脉络见[架构总览](/zh/guide/advanced/architecture)。
- 本表会随功能迭代更新。发现术语含义与代码不一致时，以源码为准，并按[贡献指南](/zh/guide/advanced/contributing)提出修正。

## 作品与玩法

| 术语      | 英文 / 别名                 | 含义                                                                                    | 相关页面                                        |
| --------- | --------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------- |
| VN        | Visual Novel，视觉小说      | 以文本叙事为主、辅以立绘与音乐的游戏类型，vnweb 的主要管理对象                          | [什么是 vnweb](/zh/guide/intro/what-is-vnweb)   |
| Galgame   | 美少女游戏                  | 源自日语的称呼，常与视觉小说交叉使用；本仓库攻略提示词也使用这一说法                    | [攻略与路线进度](/zh/guide/feats/walkthroughs)  |
| ADV / AVG | Adventure Game              | 视觉小说的一种常见标注类型，常见于平台元数据                                            | [扫描与游戏库](/zh/guide/feats/game-library)    |
| 路线      | Route                       | 攻略结构中的第二级，通常对应某角色线或章节，可拖拽排序                                  | [攻略与路线进度](/zh/guide/feats/walkthroughs)  |
| END       | Ending，结局                | 路线下的具体结局，类型为 `normal` / `bad` / `good` / `true`                             | [攻略与路线进度](/zh/guide/feats/walkthroughs)  |
| 步骤      | Step                        | 结局下的操作项，类型为 `choice`（选项）、`save`（存档）、`load`（读档）、`note`（备注） | [攻略与路线进度](/zh/guide/feats/walkthroughs)  |
| CG        | Computer Graphics           | 游戏事件图 / 插画，可归入「游戏 CG」备份分类                                            | [备份、恢复与同步](/zh/guide/feats/save-backup) |
| PV        | Promotion Video，预告片     | 宣传视频，支持 HLS、视频直链、Bilibili、YouTube 等来源                                  | [PV 与 OST](/zh/guide/feats/media)              |
| OST       | Original Soundtrack，原声集 | 游戏原声专辑与曲目，支持网易云、Meting、Enhanced API 等来源                             | [PV 与 OST](/zh/guide/feats/media)              |
| FD        | Fan Disc，粉丝碟            | 本篇之后的追加作品；与本篇攻略建议分开保存                                              | [攻略与路线进度](/zh/guide/feats/walkthroughs)  |

## 资料与平台

| 术语             | 英文 / 别名                 | 含义                                                                | 相关页面                                                      |
| ---------------- | --------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| 刮削 / 刮削器    | Scraping / Metadata Scraper | 从外部平台抓取作品资料与图片并写入本地库的过程                      | [平台接入与资料更新](/zh/guide/feats/platforms)               |
| Provider         | 数据源 / 插件               | 实现统一接口的平台适配器，如 `bangumi`、`steam`、`vndb`             | [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) |
| 能力标记         | Capability                  | provider 的 `manual-search`、`bulk-import`、`account-bind` 三种能力 | [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) |
| 角色 Provider    | Character Provider          | 专门拉取角色资料与立绘的 provider，当前有 VNDB / Bangumi / YMGal    | [角色、摘录与回忆](/zh/guide/feats/game-notes)                |
| ID 映射          | ID Mapping                  | 本地 `gameId` 与平台 `externalId` 的对应关系，存于 `game_id_map` 表 | [API 与数据层](/zh/guide/advanced/api-and-data)               |
| 账号绑定         | Account Bind                | 把平台账号与本地库关联，用于导入收藏或推送状态                      | [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) |
| 状态推送         | Status Push                 | 把本地游玩状态同步到 Bangumi / VNDB，记录写入 `game_status_push`    | [启动与游玩记录](/zh/guide/feats/play-records)                |
| 多对一映射       | Status Mapping              | 把多种本地状态映射到同一平台状态值的配置                            | [平台接入与资料更新](/zh/guide/feats/platforms)               |
| Bangumi 个人令牌 | Personal Token              | Bangumi 当前使用的凭证方式，已取代 OAuth 配置                       | [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) |
| VNDB ID          | `v\d+` / `c\d+`             | VNDB 作品 ID（如 `v184`）与角色 ID（如 `c123`）                     | [角色、摘录与回忆](/zh/guide/feats/game-notes)                |
| SteamGridDB      | 图片库                      | 提供封面、背景、图标与 Logo 的图片来源                              | [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) |
| Meting           | `@meting/core`              | 读取网易云等音乐平台曲目的 SDK，可配置码率与封面尺寸                | [平台接入与资料更新](/zh/guide/feats/platforms)               |
| Enhanced API     | 增强接口                    | 可配置 `MUSIC_U` 与本地 SDK 的 OST 播放方案                         | [平台接入与资料更新](/zh/guide/feats/platforms)               |
| yjgalgame        | 攻略来源                    | 社区攻略站点，可作为攻略搜索与导入来源                              | [攻略与路线进度](/zh/guide/feats/walkthroughs)                |

## 工程技术

| 术语                | 英文 / 别名        | 含义                                                                      | 相关页面                                        |
| ------------------- | ------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- |
| App Router          | Next.js App Router | Next.js 的路由范式，以 `app/` 目录下的 `page.tsx` / `layout.tsx` 组织页面 | [架构总览](/zh/guide/advanced/architecture)     |
| Turbopack           | —                  | Next.js 的构建工具，本项目在 `next.config.ts` 中启用                      | [架构总览](/zh/guide/advanced/architecture)     |
| Standalone          | 独立产物           | `output: 'standalone'` 生成的可脱离源码运行的服务端包                     | [架构总览](/zh/guide/advanced/architecture)     |
| route.ts            | 服务端路由         | `app/api/**/route.ts` 导出 HTTP 动词函数，提供服务端实现                  | [API 与数据层](/zh/guide/advanced/api-and-data) |
| Drizzle             | Drizzle ORM        | TypeScript ORM，schema 定义在 `db/schema.ts`，迁移在 `drizzle/`           | [API 与数据层](/zh/guide/advanced/api-and-data) |
| libSQL              | `@libsql/client`   | SQLite 兼容的客户端驱动，用于连接本地数据库文件                           | [API 与数据层](/zh/guide/advanced/api-and-data) |
| 迁移                | Migration          | 由 `drizzle-kit generate` 生成、`db:migrate` 执行的 schema 变更           | [API 与数据层](/zh/guide/advanced/api-and-data) |
| react-query         | TanStack Query     | 管理服务端状态、缓存与失效的库                                            | [API 与数据层](/zh/guide/advanced/api-and-data) |
| Jotai               | —                  | 原子化客户端状态管理库                                                    | [架构总览](/zh/guide/advanced/architecture)     |
| Zod                 | —                  | 运行时 schema 校验库，用于攻略导入与工具参数                              | [API 与数据层](/zh/guide/advanced/api-and-data) |
| shadcn/ui           | —                  | 基于 Radix 的组件集合，位于 `components/ui/`                              | [贡献指南](/zh/guide/advanced/contributing)     |
| Tailwind CSS v4     | —                  | 工具类样式框架，自定义组件需使用 v4 语法                                  | [贡献指南](/zh/guide/advanced/contributing)     |
| 无边框              | Borderless         | 外观设置中的边框开关，组件边框需参考其状态                                | [外观与主题](/zh/guide/feats/custom-theme)      |
| `--app-font-family` | 全局字体变量       | 统一驱动应用字体的 CSS 变量                                               | [外观与主题](/zh/guide/feats/custom-theme)      |
| oxlint / oxfmt      | —                  | 项目的 lint 与格式化工具，分别替代 ESLint / Prettier                      | [贡献指南](/zh/guide/advanced/contributing)     |

## Agent 与数据

| 术语        | 英文 / 别名                          | 含义                                                             | 相关页面                                                      |
| ----------- | ------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Agent       | 智能体                               | 能感知上下文、调用工具并完成任务的模型系统                       | [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)              |
| WebMCP      | Web Model Context Protocol           | 让网页把能力注册为工具供 Agent 调用的机制                        | [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)              |
| Polyfill    | `@mcp-b/webmcp-polyfill`             | 浏览器不原生支持 `document.modelContext` 时的兜底实现            | [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) |
| 工具调用    | Tool Calling / Function Calling      | 模型输出结构化函数名与参数，由应用执行并返回结果                 | [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)              |
| 生成式 UI   | Generative UI                        | 工具结果渲染成的可交互卡片，确认后才执行写操作                   | [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)              |
| SSE         | Server-Sent Events                   | 流式对话使用的响应协议，API 层用 `fetch` + `ReadableStream` 读取 | [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)              |
| OpenAI 兼容 | OpenAI-compatible                    | 实现相同接口形状的模型服务，可替换 baseUrl 接入                  | [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)              |
| frontmatter | YAML Frontmatter                     | Markdown 文件头部的元数据区，用于回忆标题、标签、日期等          | [角色、摘录与回忆](/zh/guide/feats/game-notes)                |
| MDX         | —                                    | 可在 Markdown 中使用组件的格式，回忆正文使用 MDX 渲染            | [角色、摘录与回忆](/zh/guide/feats/game-notes)                |
| XLSX        | Excel 工作簿                         | 台词摘录、计时记录等导出的表格格式，由 ExcelJS 生成              | [角色、摘录与回忆](/zh/guide/feats/game-notes)                |
| 本地优先    | Local-first                          | 默认把资料与进度保存在本地，外发数据由用户显式决定               | [什么是 vnweb](/zh/guide/intro/what-is-vnweb)                 |
| GraphRAG    | Graph Retrieval-Augmented Generation | 拟议中的基于知识图谱的检索方案，目标是按进度控制剧透             | [更新日志与路线图](/zh/guide/advanced/changelog)              |

## 备份与桌面端

| 术语               | 英文 / 别名                  | 含义                                                             | 相关页面                                        |
| ------------------ | ---------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| WebDAV             | —                            | 基于 HTTP 的远程文件协议，用于备份同步                           | [备份、恢复与同步](/zh/guide/feats/save-backup) |
| S3                 | S3-compatible Object Storage | 兼容 S3 API 的对象存储，可配置 endpoint、bucket 等               | [备份、恢复与同步](/zh/guide/feats/save-backup) |
| `backup-meta.json` | —                            | 远端备份目录中的日期元数据文件                                   | [备份、恢复与同步](/zh/guide/feats/save-backup) |
| Tauri              | Tauri v2                     | 用 Rust 构建桌面壳、用 Web 技术渲染界面的框架                    | [命令行工具](/zh/guide/feats/other)             |
| Cargo Workspace    | —                            | Rust 工作区，包含 `vnweb-cli` 与 `vnweb-desktop` 两个 crate      | [架构总览](/zh/guide/advanced/architecture)     |
| NSIS               | —                            | Windows 安装包格式，安装/卸载钩子维护用户 `PATH`                 | [命令行工具](/zh/guide/feats/other)             |
| 便携模式           | Portable                     | 安装目录存在 `portable` 标记时，数据写入安装目录下的 `user-data` | [命令行工具](/zh/guide/feats/other)             |
| `VNWEB_DATA_DIR`   | —                            | 指定用户数据目录的环境变量，默认随安装形态变化                   | [命令行工具](/zh/guide/feats/other)             |

## 按场景索引

### 我想把游戏整理进库

1. 先理解 **VN**、**Galgame** 与 **ADV / AVG** 的标注差异，它们影响平台搜索关键词。
2. 配置扫描目录与排除规则，了解 **刮削** 会从平台写入哪些字段。
3. 通过 **ID 映射** 把本地游戏与平台条目绑定；重复条目可用合并接口处理。
4. 需要图片时，区分 **SteamGridDB** 提供的封面/背景/图标/Logo 与游戏自身的 **CG**。

相关页面：[扫描与游戏库](/zh/guide/feats/game-library) · [平台接入与资料更新](/zh/guide/feats/platforms)

### 我想照着攻略推游戏

1. 攻略结构是 **路线 → END → 步骤**，步骤类型决定界面上的提示样式。
2. **FD** 建议与本篇分开保存为两份攻略。
3. 进度勾选会通过 API 持久化；`group` 字段对应日期或章节分组。

相关页面：[攻略与路线进度](/zh/guide/feats/walkthroughs)

### 我想接入 AI 能力

1. **OpenAI 兼容** 决定模型能否直接接入；**SSE** 决定能否流式输出。
2. **WebMCP** 是工具注册机制，浏览器缺原生支持时由 **Polyfill** 兜底。
3. **工具调用** 的结果可能渲染为**生成式 UI** 卡片，确认后才写库。
4. 模型给出的参数里常出现 **VNDB ID** 或平台名，需要靠 **ID 映射** 解析到游戏。

相关页面：[AI 助手与 WebMCP](/zh/guide/feats/ai-assistant) · [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)

### 我想迁移或备份数据

1. 先分清 **WebDAV**、**S3** 两种远端协议的配置字段。
2. 远端目录里的 `backup-meta.json` 用于判断备份日期；恢复是整体替换而非合并。
3. 安装包中的 **Tauri**、**Cargo Workspace**、**NSIS** 与 **便携模式** 决定数据落在哪里。
4. 路径问题优先检查 `VNWEB_DATA_DIR` 与 `VNWEB_APP_DIR`。

相关页面：[备份、恢复与同步](/zh/guide/feats/save-backup) · [命令行工具](/zh/guide/feats/other)

### 我想参与开发

1. 页面在 **App Router** 下组织，构建产物是 **Standalone**。
2. 请求经 **route.ts** 访问 **Drizzle** / **libSQL**；schema 变更通过**迁移**落地。
3. 服务端状态用 **react-query**，客户端状态用 **Jotai**，输入校验用 **Zod**。
4. UI 优先复用 **shadcn/ui**，自定义样式用 **Tailwind CSS v4**，通过 `oxlint / oxfmt` 检查。

相关页面：[贡献指南](/zh/guide/advanced/contributing) · [API 与数据层](/zh/guide/advanced/api-and-data)

## 延伸阅读

- [架构总览](/zh/guide/advanced/architecture) · [API 与数据层](/zh/guide/advanced/api-and-data)
- [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) · [常见问题](/zh/guide/advanced/faq)
