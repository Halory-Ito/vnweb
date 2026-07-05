# 项目结构

本文详细介绍 vnweb 的目录结构、设计原则和开发约定。

## 核心设计原则

### 组件规范

- 单个组件文件不超过 **200 行**
- 超过 **150 行** 时考虑拆分为子组件
- 业务逻辑通过自定义 Hook 抽离，组件只做渲染
- 组件位于 `components/` 或各模块的 `_ui/` 目录

### 功能模块结构

每个功能模块（`features/`）遵循统一结构：

```text
features/
└── <module>/
    ├── hooks/        # 自定义 Hook
    ├── components/   # UI 组件
    ├── data/         # 数据层
    ├── views/        # 页面视图
    └── index.tsx     # 模块入口
```

### API 层规范

- 所有 API 请求通过 `app/api/` 下的模块发起
- 统一使用 `lib/request-utils.ts` 中的 `api` 实例
- 不在组件中直接调用 `fetch`

### 样式规范

- 优先使用 shadcn/ui 中已有组件
- 优先使用 `outlined` 风格
- 自定义组件使用 Tailwind CSS v4 语法
- 避免卡片组件内嵌套卡片组件

## 目录详解

### app/ — 页面与 API

Next.js App Router 的路由和 API 端点：

| 路径             | 说明                                |
| ---------------- | ----------------------------------- |
| `app/layout.tsx` | 根布局，配置 Provider、主题、字体等 |
| `app/page.tsx`   | 首页                                |
| `app/game/`      | 游戏相关页面（详情、角色、收藏夹）  |
| `app/record/`    | 统计记录页面                        |
| `app/scan/`      | 扫描管理页面                        |
| `app/quote/`     | 台词管理页面                        |
| `app/ost/`       | OST 管理页面                        |
| `app/pv/`        | PV 管理页面                         |
| `app/settings/`  | 设置页面                            |
| `app/market/`    | 插件市场页面                        |
| `app/api/`       | API 端点                            |

### components/ — 组件

| 目录                    | 说明                         |
| ----------------------- | ---------------------------- |
| `components/ui/`        | shadcn/ui 基础组件           |
| `components/game/`      | 游戏相关业务组件             |
| `components/layout/`    | 布局组件（侧边栏、导航栏等） |
| `components/providers/` | React Context Provider       |
| `components/record/`    | 记录/统计组件                |
| `components/scan/`      | 扫描组件                     |
| `components/settings/`  | 设置组件                     |
| `components/vndb/`      | VNDB 相关组件                |
| `components/market/`    | 插件市场组件                 |

### lib/ — 工具库

| 文件/目录             | 说明                   |
| --------------------- | ---------------------- |
| `request-utils.ts`    | Axios 实例和请求工具   |
| `drizzle.ts`          | Drizzle ORM 数据库连接 |
| `utils.ts`            | 通用工具函数           |
| `vndb-client.ts`      | VNDB API 客户端        |
| `vndb-utils.ts`       | VNDB 数据处理          |
| `cloud-sync-utils.ts` | 云同步工具             |
| `font-utils.ts`       | 字体管理工具           |
| `proxy-image.ts`      | 图片代理工具           |
| `lib/game/`           | 游戏相关工具           |
| `lib/plugins/`        | 插件系统               |
| `lib/providers/`      | 外部数据源适配         |
| `lib/server/`         | 服务端工具             |
| `lib/settings/`       | 设置工具               |

### win/ — Windows 本地能力

| 文件                      | 说明               |
| ------------------------- | ------------------ |
| `extract-icon.ts`         | 提取可执行文件图标 |
| `fontfile.ts`             | 读取系统字体       |
| `game-process-monitor.ts` | 游戏进程监控       |

## 开发脚本

| 命令                | 说明                |
| ------------------- | ------------------- |
| `npm run dev`       | 启动开发服务器      |
| `npm run build`     | 构建生产版本        |
| `npm run start`     | 启动生产服务        |
| `npm run lint`      | 代码检查 (oxlint)   |
| `npm run lint:fix`  | 自动修复            |
| `npm run fmt`       | 格式化代码 (oxfmt)  |
| `npm run test`      | 运行测试 (Vitest)   |
| `npm run db:studio` | 打开 Drizzle Studio |
| `npm run cli`       | 运行 TUI 命令行     |
| `npm run docs:dev`  | 启动文档开发服务器  |
