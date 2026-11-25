# 命令行工具与桌面端配合

日常管理用 Web UI，快速启动游戏用命令行。vnweb 提供三种入口：源码目录下的 `vnweb.bat`、基于 Commander 的 Node CLI（`cmd/tui.ts`），以及安装包中的原生 `vnweb.exe`（Rust 编写，负责拉起桌面端或转发参数给 CLI）。

> 命令行直接读写同一个 SQLite 数据库，因此执行前无需启动 Web 服务，但建议先关闭正在运行的 vnweb，避免数据库写入竞争。

## 入口与快捷启动

### Windows 批处理入口

在项目目录运行 `.\vnweb.bat`：

- **无参数**：启动已经构建的 Web 服务（默认端口 `8999`）。
- **带参数**：进入命令行模式，转发给 CLI。

如果通过 `init.bat` 把项目目录加入了用户 `PATH`，可以在新终端中从任意目录使用 `vnweb`。源码运行方式见[安装与配置](/zh/guide/intro/installation-and-configuration)。

### 原生入口（安装包）

安装包中的 `vnweb.exe` 行为稍有不同：

| 调用方式          | 行为                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------ |
| `vnweb`（无参数） | 若同目录存在 `vnweb-desktop.exe`，拉起 Tauri 桌面端；否则运行 `standalone/server.js` |
| `vnweb <参数>`    | 转发到 `cli/vnweb-cli.mjs`                                                           |

它按以下顺序解析目录：

- `VNWEB_APP_DIR`：应用目录（内含 `standalone/server.js`）。
- `VNWEB_DATA_DIR`：用户数据目录。未显式设置时，便携安装使用安装目录下的 `user-data`，Windows 普通安装使用 `%APPDATA%\vnweb`。
- `VNWEB_NODE_PATH`：内嵌 Node 运行时路径，默认使用安装目录下的 `runtime/node.exe`，再回退到 PATH 中的 `node`。
- `PORT` / `HOSTNAME`：无参数启动服务时的监听参数，默认 `8999` / `0.0.0.0`。

## 命令大全

命令基于 `commander` 实现，程序名为 `vnweb`，内置 `--help` 与版本信息。

```powershell
vnweb --help                       # 查看帮助与示例
vnweb list game                    # 列出所有游戏（别名 list g）
vnweb list g -p 2 -s 10            # 第 2 页，每页 10 条
vnweb list collection              # 列出所有收藏夹（别名 list c）
vnweb open "我的收藏"              # 按名称查看收藏夹中的游戏
vnweb open 3                       # 按收藏夹 ID 查看
vnweb search "白色相簿"            # 按名称关键字搜索
vnweb search 纯白 -p 1 -s 5        # 搜索并分页
vnweb start 12                      # 按游戏 ID 启动并计时（别名 s）
vnweb s 12                          # 同上
vnweb start                         # 启动最近一次游玩的游戏
```

### 命令参考

| 命令                         | 参数                                  | 选项                                            | 说明                                    |
| ---------------------------- | ------------------------------------- | ----------------------------------------------- | --------------------------------------- |
| `list game` / `list g`       | 无                                    | `-p, --page`，默认 `1`；`-s, --size`，默认 `20` | 按最近游玩时间、总时长、ID 倒序列出游戏 |
| `list collection` / `list c` | 无                                    | 无                                              | 按 ID 倒序列出收藏夹                    |
| `search`                     | `<keyword...>`，支持空格分隔          | `-p` / `-s`                                     | 在中文名与原名中模糊匹配                |
| `open`                       | `<collection_name...>`，名称或数字 ID | `-p` / `-s`                                     | 列出指定收藏夹内的游戏                  |
| `start` / `s`                | `[game_id]`，可省略                   | 无                                              | 启动游戏并开启计时                      |

### 输出说明

表格列包括 `id`、标题（优先中文名）、是否运行中、累计时长（`HH:MM:SS`）、最近游玩日期。没有数据时显示「暂无游戏」或「暂无收藏夹」。

分页是对查询结果做切片，页码超出范围会被夹到有效区间。

## 启动游戏与计时

1. 先用 `list game` 或 `search` 找到游戏 ID。
2. 在 Web 界面的「游戏详情 → 设置」中确认可执行文件路径。命令行要求路径是**绝对路径**，且文件必须存在；路径中的 `/` 会被规范化为 Windows 反斜杠。
3. 执行 `vnweb start <ID>`。程序会以 `detached` 方式启动进程，并在 `game_play` 表中写入 `isRunning = 1` 与 `lastLaunchedAt`。
4. 计时界面每秒刷新「本次计时」。按 **`q`** 结束计时并保存记录（调用 `finalizeGameSession`）。
5. 如果游戏已经在计时中，再次执行会提示"已附加计时"，不会重复启动进程。

::: danger Ctrl+C 不会保存本次计时
`start` 命令中 `Ctrl+C` 会直接退出进程，**不会**调用 `finalizeGameSession`。要保存本次时长，请按 `q`。
:::

省略 ID 时，会选择 `lastLaunchedAt` 最近的一款游戏。如果从未通过 vnweb 启动过游戏，会提示需要先指定游戏 ID。

## 与桌面端配合

桌面端是基于 **Tauri v2** 的壳（`crates/vnweb-desktop`），内嵌 standalone 服务端与 Node 运行时。它提供：

- **单实例锁**：避免重复打开多个窗口。
- **系统托盘**：常驻后台，便于快速唤起。
- **子进程生命周期托管**：Windows 上使用 Job Object 管理服务端进程。
- **端口分配与就绪探活**：启动 `server.js` 后检测服务可用再展示界面。
- **外部链接**：系统默认浏览器打开，而不是在应用内跳转。
- **原生文件对话框**：备份 ZIP、计时 XLSX、报告 PNG 的另存为；游戏可执行文件和存档目录的选择。
- **无边框与标题栏联动**：关闭「原生标题栏」后使用自定义窗口控件，见[外观与主题](/zh/guide/feats/custom-theme)。

相关 npm 脚本：

| 脚本                       | 作用                                            |
| -------------------------- | ----------------------------------------------- |
| `npm run cli`              | 以 `tsx cmd/tui.ts` 运行 CLI                    |
| `npm run build:cli`        | 构建独立 CLI bundle 到 `dist/cli/vnweb-cli.mjs` |
| `npm run build:standalone` | 构建可脱离源码运行的 standalone 服务端          |
| `npm run tauri:dev`        | 启动 Tauri 开发模式                             |
| `npm run tauri:build`      | 准备资源并构建桌面安装包                        |
| `npm run tauri:prepare`    | 只准备 Tauri 内嵌资源                           |

桌面端与 Web 端共享同一份数据目录和设置文件，因此[备份与同步](/zh/guide/feats/save-backup)配置会同时生效。

## 排错

| 现象                            | 处理方式                                          |
| ------------------------------- | ------------------------------------------------- |
| `vnweb` 不是内部命令            | 确认已运行 `init.bat`，并新开终端使 `PATH` 生效   |
| CLI 提示"该游戏未配置 exe 路径" | 先在 Web 界面设置可执行文件                       |
| 提示"exe 路径必须是绝对路径"    | 使用类似 `D:\Games\Game\game.exe` 的完整路径      |
| 游戏启动了但没有计时            | 检查是否通过 `q` 正常结束；中途 `Ctrl+C` 不会保存 |
| 数据库被占用                    | 关闭 Web 服务与 Drizzle Studio 后重试             |
| 桌面端端口冲突                  | 检查端口分配逻辑与是否有残留服务端进程            |
| 安装包内 CLI 入口缺失           | 重新构建 standalone 资源，或设置 `VNWEB_APP_DIR`  |

## 延伸阅读

- [什么是 vnweb](/zh/guide/intro/what-is-vnweb) · [安装与配置](/zh/guide/intro/installation-and-configuration)
- [启动与游玩记录](/zh/guide/feats/play-records) · [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)
- [架构总览](/zh/guide/advanced/architecture) · [贡献指南](/zh/guide/advanced/contributing)
- [常见问题](/zh/guide/advanced/faq) · [术语表](/zh/guide/advanced/glossary)
