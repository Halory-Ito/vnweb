# 贡献指南

欢迎通过 Issue 或 Pull Request 参与 vnweb。本页汇总开发环境搭建、脚本说明、代码规范与常见扩展流程。架构背景见[架构总览](/zh/guide/advanced/architecture)，请求规范见 [API 与数据层](/zh/guide/advanced/api-and-data)。

## 开发环境搭建

**环境要求**：Node.js ≥ 20.9、npm，推荐 Windows（本地目录扫描、可执行文件启动、进程计时、系统字体都依赖本机文件系统）。

```bash
git clone https://github.com/Halory-Ito/vnweb.git
cd vnweb
npm install
npm run db:push
npm run dev          # 开发模式 http://localhost:3000
```

生产模式：

```bash
npm run build
npm run start        # http://localhost:8999，监听 0.0.0.0
```

Windows 用户也可以双击 `init.bat`：脚本会检查环境、安装依赖、从 `data/example/` 补齐缺失设置、初始化数据库、构建应用，并把项目目录加入用户 `PATH`。

::: warning init.bat 会重建数据库
已有数据库时，脚本会先把 `local.db` 及 `-wal` / `-shm` / `-journal` 备份到 `backups/db/`，再创建空库。运行前请关闭正在运行的 vnweb 服务与 Drizzle Studio，并另存一份备份。
:::

::: danger Next.js 版本
本仓库使用 **Next.js 16**，API、约定和文件结构可能与常见教程不同。写代码前请阅读 `node_modules/next/dist/docs/` 中相关指南并注意弃用提示；该提示块由 `next dev` 自动生成，删除后会被重新写入。
:::

## 脚本说明

以 `package.json` 为准：

| 脚本                  | 实际命令                                                                       | 用途                           |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------ |
| `dev`                 | `next dev`                                                                     | 开发服务，端口 3000            |
| `build`               | `next build`                                                                   | 生产构建（standalone 输出）    |
| `start`               | `next start -p 8999 --hostname 0.0.0.0`                                        | 启动生产服务                   |
| `cli`                 | `tsx cmd/tui.ts`                                                               | 运行命令行工具                 |
| `build:cli`           | `node scripts/build-cli.mjs`                                                   | 构建独立 CLI bundle            |
| `build:standalone`    | `node scripts/build-standalone.mjs`                                            | 构建可脱离源码的 standalone 包 |
| `db:generate`         | `drizzle-kit generate`                                                         | 生成迁移 SQL                   |
| `db:init` / `db:push` | `drizzle-kit push`                                                             | 同步 schema 到数据库           |
| `db:migrate`          | `tsx cmd/migrate-db.ts`                                                        | 执行迁移                       |
| `db:studio`           | `drizzle-kit studio --port 5123 --host 127.0.0.1`                              | 可视化数据库                   |
| `lint` / `lint:fix`   | `oxlint` / `oxlint --fix`                                                      | 代码检查与自动修复             |
| `lint:output`         | `oxlint --format=unix >> oxlint-report.txt`                                    | 输出检查报告                   |
| `fmt` / `fmt:check`   | `oxfmt` / `oxfmt --check`                                                      | 格式化与格式检查               |
| `tauri`               | `node scripts/run-tauri.mjs`                                                   | 运行 Tauri                     |
| `tauri:dev`           | `node scripts/run-tauri.mjs dev`                                               | Tauri 开发模式                 |
| `tauri:build`         | `node scripts/prepare-tauri-resources.mjs && node scripts/run-tauri.mjs build` | 构建桌面安装包                 |
| `tauri:prepare`       | `node scripts/prepare-tauri-resources.mjs`                                     | 准备内嵌资源                   |
| `docs:dev`            | `vitepress dev docs`                                                           | 本地预览文档                   |
| `docs:build`          | `vitepress build docs`                                                         | 构建文档                       |
| `docs:preview`        | `vitepress preview docs`                                                       | 预览文档构建产物               |

**测试约定**：跳过 Vitest 测试。较小的页面样式、动效或交互类改动由用户自行验收，Agent 只做代码修改与静态检查（`tsc`、`oxlint`、`oxfmt`），除非明确要求不主动做浏览器实测。

## 代码规范

### 组件与逻辑

- 单个组件文件**不超过 200 行**；超过 150 行时考虑拆分为子组件。
- 业务逻辑用自定义 hook 抽离，组件只做渲染。
- 优先使用 `components/ui` 中已有的 shadcn/ui 组件，优先 outlined 风格。
- 自定义组件使用 Tailwind CSS v4 语法。
- 避免卡片组件内再嵌套一层卡片；避免在组件中增加 `secondary` 提示内容，保持简洁。
- 每次改动页面都要注意响应式布局，并与既有样式保持一致。
- 全局字体统一使用 `--app-font-family`，不要通过 `font-mono` / `font-sans` / `font-serif` 区分字体（字体预览区除外，路径/编号/代码按设计规范可使用 `font-mono`）。
- 注意错误边界与渲染性能：避免局部变化导致整页重渲染。
- 组件边框需要参考系统设置中的「无边框」开关状态。

### 依赖管理

添加新依赖前先确认现有依赖能否实现功能；优先使用原生 API 和项目已有的库。项目已包含 axios、react-query、Jotai、Zod、Drizzle、ExcelJS、hls.js 等常用能力。

### API 层

- 跨模块领域请求放根级 `api/`（`@/api`），按域拆分，由 `api/index.ts` 统一出口。
- 仅本模块使用的请求放 `features/xxx/xxx-api.ts`，由模块出口文件导出。
- 领域类型放根级 `types/`（`@/types`），由 `types/index.ts` 出口；模块内部类型可留在模块内。
- 所有 API 请求通过 `app/api` 下的 `route.ts` 发起服务端实现。
- 使用 `lib/request-utils.ts` 封装的 `api` 实例；不要在组件中直接 `fetch`。
- axios 写法统一为 `api.request({ method, url })` 风格。

### 目录结构

```text
features/xxx/
├── hooks/        交互与业务 hook
├── components/   子组件
├── data/         静态数据、示例、提示词
├── views/        页面级视图
├── lib/          模块内工具与常量
├── xxx-api.ts    模块内请求
└── index.ts(x)   模块出口
```

## 提交流程

1. Fork 仓库，新建分支。
2. 完成改动并自测。
3. 提交前执行：

   ```bash
   npm run lint
   npm run fmt:check
   npm run build
   ```

4. 发起 Pull Request，说明改动目的与验证方式。

`lint-staged` 会对 `*.{js,jsx,ts,tsx,mjs,cjs}` 运行 `npm run lint`，并对所有文件运行 `oxfmt --no-error-on-unmatched-pattern`。

项目习惯：每完成一个功能，在 `plan.md` 中把对应条目打勾；修复错误时优先查看 `errors.md`，每修复一个就把该条目从文件中删除。

## 如何新增一个功能模块

1. 在 `features/` 下新建 `xxx/`，按规范建立 `hooks`、`components`、`data`、`views`、`lib` 与 `index.ts(x)`。
2. 如需要页面，在 `app/` 对应路径添加 `page.tsx` / `layout.tsx`，并把页面级视图放进 `views/`。
3. 定义跨模块类型：新建 `types/xxx.ts`，并在 `types/index.ts` 添加 `export *`。
4. 定义请求：跨模块用 `api/xxx.ts` 并在 `api/index.ts` 出口；模块内用 `features/xxx/xxx-api.ts`。
5. 服务端实现放在 `app/api/xxx/route.ts`，导出所需 HTTP 动词函数，返回 `{ data }` 或 `{ error }`。
6. 需要数据库表时，在 `db/schema.ts` 定义表，运行 `npm run db:generate` 生成迁移。
7. 需要文档时，在 `docs/guide/feats/` 添加页面，并在 `docs/.vitepress/guide-modules.ts` 中加入导航条目；英文站镜像到 `/en/` 对应路径，站内链接使用绝对路径。

## 如何新增一个平台 provider

1. 在 `lib/providers/` 下新建 `xxx-provider.ts`，实现 `GameProvider` 接口（见[平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)）。
2. 在 `lib/providers/registry.ts` 的 `GAME_PROVIDERS` 数组中注册；按需填写 `capabilities`。
3. 在 `data/example/platform.json` 中添加配置模板，并在 `lib/settings/platform-settings.ts` 中加入读写与校验逻辑。
4. 如果是角色数据源，还要实现 `CharacterProvider`，并在 `lib/providers/characters/metadata.ts` 与 `registry.ts` 的 `getCharacterProviders()` 中注册。
5. 如需把能力暴露给模型，按下面的流程新增 WebMCP 工具。

## 如何新增一个 WebMCP 工具

1. 在 `webmcp/xxx/lib/xxx-tool-schema.ts` 定义工具名常量与 Zod 输入 schema。
2. 在 `webmcp/xxx/hooks/use-xxx-tool.ts` 中用 `useWebMCP` 注册工具；注册前确保调用过 `ensureWebMcpRuntime()`。
3. 如需生成式 UI 卡片，在 `webmcp/xxx/components/` 下实现确认组件。
4. 在 `webmcp/xxx/index.ts` 导出工具名、schema、hook 与组件。
5. 在 AI 文档的[内置工具清单](/zh/guide/feats/ai-assistant#内置工具清单)中补充说明。

## 排错

| 现象                                | 处理方式                                               |
| ----------------------------------- | ------------------------------------------------------ |
| `npm run dev` 报 Next.js API 不兼容 | 阅读 `node_modules/next/dist/docs/` 对应指南           |
| 数据库表不存在                      | 执行 `npm run db:push` 或 `npm run db:migrate`         |
| 端口被占用                          | 调整 `start` 脚本的 `-p` 参数或关闭占用进程            |
| lint / fmt 失败                     | 先跑 `npm run lint:fix` 与 `npm run fmt`               |
| 文档导航不显示新页面                | 检查 `guide-modules.ts` 与 `config.mts` 的 locale 配置 |

## 延伸阅读

- [架构总览](/zh/guide/advanced/architecture) · [API 与数据层](/zh/guide/advanced/api-and-data)
- [常见问题](/zh/guide/advanced/faq) · [术语表](/zh/guide/advanced/glossary)
- [外观与主题](/zh/guide/feats/custom-theme) · [命令行工具](/zh/guide/feats/other)
