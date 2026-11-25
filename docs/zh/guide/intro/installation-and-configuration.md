# 安装与配置

这篇文档负责把 vnweb 跑起来。装好之后，按[快速开始](./quick-start)走一遍完整流程；想先了解它是什么，见[什么是 vnweb](./what-is-vnweb)。

## 运行环境

准备 **Node.js 20.9 或更新版本**和 npm。`init.bat` 会显式检查版本，低于 20.9 会直接报错退出。

```bash
node -v    # 建议 v20.9+
npm -v
```

推荐在 Windows 上运行：本地目录扫描、可执行文件启动、进程计时、系统字体与原生窗口选择，都依赖运行 vnweb 的那台电脑直接访问文件和进程。其他平台也能通过源码方式启动 Web 服务，但涉及可执行文件与系统字体时体验可能不同。

::: tip 你不需要准备数据库服务
vnweb 使用 SQLite（libSQL），默认库文件就是项目目录下的 `local.db`，不需要另外安装 MySQL 或 PostgreSQL。
:::

## 方式一：Windows 一键初始化

1. 克隆仓库或下载源码。
2. 双击项目根目录的 `init.bat`。脚本会安装依赖、补齐缺失设置、初始化数据库、构建应用并将项目目录加入用户 `PATH`。
3. 在新终端运行 `vnweb`，然后在浏览器打开 `http://localhost:8999`。

### 脚本实际做了六件事

| 步骤 | 动作                                                                     | 失败时常见原因                               |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------- |
| 1/6  | 检查 Node.js、npm 与版本                                                 | 未安装 Node.js，或版本低于 20.9              |
| 2/6  | `npm install` 安装依赖                                                   | 网络或 npm 镜像配置问题                      |
| 3/6  | `node --import tsx cmd/init-settings.ts` 从 `data/example/` 补齐缺失配置 | 配置文件格式被手改坏                         |
| 4/6  | 备份已有数据库并执行 `npm run db:migrate`                                | 数据库被 vnweb / Drizzle Studio 占用         |
| 5/6  | `npm run build` 构建生产版本                                             | TypeScript / 构建错误，看上方日志            |
| 6/6  | 将项目目录写入用户 `PATH`                                                | 权限不足；可用 `VNWEB_INIT_SKIP_PATH=1` 跳过 |

::: warning 已有数据库时
`init.bat` 会把已有数据库和相关文件（`-wal` / `-shm` / `-journal`）移至 `backups/db/`，随后创建空库。已有游戏库时，请先关闭 vnweb 和 Drizzle Studio，并在更新前另存一份备份。
:::

如果不想修改用户环境变量，可以在执行前设置 `VNWEB_INIT_SKIP_PATH=1`；如果希望脚本结束时不要暂停，设置 `VNWEB_INIT_NO_PAUSE=1`。

```bat
set VNWEB_INIT_SKIP_PATH=1
init.bat
```

## 方式二：手动安装

适合想看清每一步、或非 Windows 平台使用源码运行的情况。

```bash
git clone https://github.com/Halory-Ito/vnweb.git
cd vnweb
npm install
npm run db:push
```

构建后在本机启动，默认访问 `http://localhost:8999`。

```bash
npm run build
npm run start        # next start -p 8999 --hostname 0.0.0.0
```

需要在开发模式下运行时，使用 `npm run dev`，默认地址为 `http://localhost:3000`。

```bash
npm run dev          # http://localhost:3000
```

::: tip 开发模式与生产模式怎么选
开发模式改动即时生效、端口 3000，适合调试；生产模式需要先构建，端口 8999 且监听 `0.0.0.0`，适合长期使用与局域网访问。
:::

### 数据库相关命令

| 命令                  | 作用                                           |
| --------------------- | ---------------------------------------------- |
| `npm run db:push`     | 将 `db/schema.ts` 同步到数据库（初次安装常用） |
| `npm run db:init`     | 同为 `drizzle-kit push` 的入口                 |
| `npm run db:migrate`  | 执行迁移；`init.bat` 用它初始化新库            |
| `npm run db:generate` | 根据 schema 生成迁移文件                       |
| `npm run db:studio`   | 打开 Drizzle Studio，地址 `127.0.0.1:5123`     |

::: danger 不要同时跑多个写库进程
`npm run db:studio`、dev/start 服务和命令行工具都可能打开同一个 SQLite 文件。迁移或重建库之前请全部关闭，否则可能出现文件占用或写入冲突。
:::

## 方式三：Tauri 桌面端

项目包含基于 **Tauri v2** 的桌面壳，以及 Rust 编写的原生 CLI 入口。Windows x64 用户可以在项目 Releases 下载 `*_x64-setup.exe` 安装包；安装器会维护用户 `PATH`。

仓库内提供的相关脚本：

| 命令                    | 作用                      |
| ----------------------- | ------------------------- |
| `npm run tauri:prepare` | 预置独立服务端与 CLI 资源 |
| `npm run tauri:dev`     | 桌面端开发模式            |
| `npm run tauri`         | 通过脚本运行 Tauri 命令   |
| `npm run tauri:build`   | 准备资源并构建桌面安装包  |

桌面端具备单实例锁、系统托盘、子进程生命周期管理，并在选择可执行文件和存档目录时使用原生窗口。导出备份 ZIP、计时 XLSX 和报告海报 PNG 时也走原生另存为窗口。

::: tip 桌面端和 Web 端的数据
桌面端默认使用共享的用户数据目录；服务端启动与 CLI 启动都会自动补齐配置并执行数据库迁移，因此能接管已有的 `local.db`，也能创建全新库。配置路径由 `VNWEB_APP_DIR` / `VNWEB_DATA_DIR` 收口，见下方「目录结构」。
:::

## 部署与独立包

### 关于 Docker

::: warning 目前没有官方 Dockerfile
仓库中**没有提供 Dockerfile 或 docker-compose 文件**。如果你想容器化，需要自行编写镜像并在镜像内安装 Node.js 20.9+、复制源码、执行 `npm install`、`npm run db:migrate` 与 `npm run build`，再以 `npm run start` 作为入口。持久化请挂载用户数据目录与数据库文件。
:::

更省事的自托管方式是使用项目自带的独立构建：

```bash
npm run build:standalone   # 生成可脱离源码运行的独立服务端与 CLI
npm run build:cli          # 只构建命令行工具
```

`build:standalone` 会在 `.next/standalone/` 下收拢服务端入口 `server.js`、静态资源、`data/example`、迁移文件与 CLI，并生成 `vnweb-portable.bat`。便携启动器支持以下环境变量：

| 变量             | 默认值                            | 说明                       |
| ---------------- | --------------------------------- | -------------------------- |
| `VNWEB_APP_DIR`  | 启动脚本所在目录                  | 应用资源目录               |
| `VNWEB_DATA_DIR` | `<应用目录>/user-data`            | 用户数据目录               |
| `PORT`           | `8999`                            | 监听端口                   |
| `HOSTNAME`       | `0.0.0.0`                         | 监听地址                   |
| `VNWEB_DB_URL`   | 取 `general.json` 的 `dbFileName` | 数据库 URL，可覆盖配置文件 |

生产服务默认监听 `0.0.0.0:8999`。如果放到公网环境，建议在前面加反向代理并配置认证与 HTTPS，不要把带凭证的服务直接暴露到公网。

## 数据库与目录结构

### 关键路径

| 路径                                             | 内容                                   |
| ------------------------------------------------ | -------------------------------------- |
| `local.db`                                       | 默认 SQLite 数据库（根目录）           |
| `data/settings/`                                 | 实际生效的本地设置                     |
| `data/example/`                                  | 可提交的设置示例，初始化时补齐缺失文件 |
| `data/services/`                                 | 服务侧数据目录（如存在）               |
| `assets/`                                        | 图片、字体等本地资源                   |
| `drizzle/`                                       | 迁移文件                               |
| `backups/db/`                                    | 一键初始化前的数据库备份               |
| `app/custom.css` 或用户数据目录下的 `custom.css` | 自定义样式                             |

数据库路径由 `VNWEB_DB_URL` 或 `data/settings/general.json` 的 `dbFileName` 决定，默认 `file:./local.db`。修改后需要重启应用才能生效。

```json
// data/settings/general.json
{
  "dbFileName": "file:./local.db",
  "agent": { "configs": [], "activeConfigId": "" },
  "goals": { "dailyPlayMinutes": 60, "yearlyCompletedGames": 12 }
}
```

::: warning 先改配置，再初始化
如果要用非默认数据库路径，请在初始化前修改 `data/settings/general.json` 的 `dbFileName`；已经运行的应用需要重启后才会读取新配置。
:::

## 首次配置向导

vnweb 没有强制的「一步一步弹窗」式向导，但第一次启动后建议按这个顺序完成配置：

1. **确认能打开界面**：开发模式 `http://localhost:3000`，生产模式 `http://localhost:8999`。
2. **登记游戏目录**：打开「扫描」，添加扫描目录并选择模式，详见[扫描与游戏库](../feats/game-library)。
3. **配置平台凭证**：按需在「设置 → 平台」填写 Steam、Bangumi、VNDB、YMGal、SteamGridDB，以及 OST 相关的 Meting / Enhanced API，详见[平台接入与资料更新](../feats/platforms)。
4. **设置可执行路径**：在游戏详情的「设置」里确认路径，之后才能[启动并计时](../feats/play-records)。
5. **调整外观与备份**：字体、背景、边框按喜好设置；备份策略见[备份、恢复与同步](../feats/save-backup)。
6. **走一遍完整流程**：[快速开始](./quick-start)把上面几步串成一条 5 分钟路径。

平台配置的字段与用途（`data/example/platform.json`）：

| 分组          | 主要字段                                                 | 用途                              |
| ------------- | -------------------------------------------------------- | --------------------------------- |
| `steam`       | `apiKey`                                                 | Steam Web API Key，用于库存与时长 |
| `bangumi`     | `useMirror`、`mirrorUrl`、`baseUrl`、`tokenUrl`          | 个人令牌与镜像接口来源            |
| `vndb`        | `baseUrl`、`oauthToken`、`oauthScope` 等                 | VNDB 账号与列表权限               |
| `ymgal`       | `baseUrl`、`clientId`、`clientSecret` 等                 | 月幕资料与用户收藏                |
| `steamgriddb` | `apiKey`、`baseUrl`                                      | 封面、背景、图标、徽标            |
| `meting`      | `bitrate`、`coverSize`、`neteaseCookie`                  | OST 读取码率、封面与网易云凭证    |
| `enhanced`    | `useLocalSdk`、`apiBase`、`musicU`、`quality`、`sdkPort` | Enhanced API 播放方式             |

::: danger 凭证安全
不要把 API Key、令牌或 Cookie 写进公开文件、截图或 Issue。平台设置会保存到 `data/settings/platform.json`，请按本地文件权限管理；排查问题时先脱敏。
:::

## 常见安装故障

### 端口已被占用

生产端口默认为 `8999`。如果端口被占用，可以修改 `package.json` 中 `start` 脚本的 `-p` 参数，或用便携启动器的 `PORT` 环境变量，然后用新端口访问。

### `init.bat` 提示数据库备份失败

通常是 vnweb 服务或 Drizzle Studio 仍占用数据库文件。关闭相关进程后重试；原库未被删除时会保留在 `backups/db/`。

### 依赖安装失败

检查网络或 npm 镜像配置后重新运行 `npm install`。`init.bat` 在第 2 步失败会直接中止，不会继续初始化数据库。

### 构建失败

看 `npm run build` 上方的具体日志。常见原因是 Node.js 版本不满足 20.9+，或本地改动引入了类型错误。可以先 `npm run lint` 与 `npm run fmt:check` 排查。

### 页面能开但游戏启动失败

这是配置问题而非安装问题：检查游戏详情的可执行路径是否为**本机绝对路径**，且文件仍存在。参见[启动与游玩记录](../feats/play-records#启动游戏并计时)与[命令行工具](../feats/other)。

### 配置改了没生效

数据库路径、平台凭证等由服务端读取，修改 `data/settings/` 后需要重启应用。平台设置可能优先读取浏览器缓存，必要时刷新页面再确认。

## 小结

- 推荐路径：Windows 双击 `init.bat` → 运行 `vnweb` → 打开 `http://localhost:8999`。
- 手动路径：`npm install` → `npm run db:push` → `npm run dev` 或 `npm run build && npm run start`。
- 桌面端与独立包可用，Docker 需要自己写镜像。
- 装好后立刻去[快速开始](./quick-start)；遇到问题先看[常见问题](/zh/guide/advanced/faq)。
