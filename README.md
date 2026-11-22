<a id="readme-top"></a>

> ⚠️ **注意**：Releases 不常更新，若要使用请直接下载源码，并按下方「快速开始」自行构建。

<!-- PROJECT SHIELDS -->

[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![Next.js][next-shield]][next-url]
[![React][react-shield]][react-url]

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="https://github.com/Halory-Ito/vnweb">
    <img src="app/icon.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">vnweb</h3>

  <p align="center">
    面向视觉小说与本地单机游戏的 Web 管理面板 —— 本地资料库 + 游戏启动器 + 媒体整理器
    <br />
    <a href="docs/index.md"><strong>浏览文档 »</strong></a>
    <br />
    <br />
    <a href="#界面截图">界面截图</a>
    &middot;
    <a href="https://github.com/Halory-Ito/vnweb/issues/new">报告问题</a>
    &middot;
    <a href="https://github.com/Halory-Ito/vnweb/issues/new">请求功能</a>
  </p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>目录</summary>
  <ol>
    <li>
      <a href="#项目简介">项目简介</a>
      <ul>
        <li><a href="#功能一览">功能一览</a></li>
        <li><a href="#技术栈">技术栈</a></li>
      </ul>
    </li>
    <li>
      <a href="#快速开始">快速开始</a>
      <ul>
        <li><a href="#环境要求">环境要求</a></li>
        <li><a href="#安装与配置">安装与配置</a></li>
      </ul>
    </li>
    <li>
      <a href="#使用说明">使用说明</a>
      <ul>
        <li><a href="#界面截图">界面截图</a></li>
        <li><a href="#命令行工具">命令行工具</a></li>
        <li><a href="#ai-助手与-webmcp-工具">AI 助手与 WebMCP 工具</a></li>
        <li><a href="#常用脚本">常用脚本</a></li>
      </ul>
    </li>
    <li><a href="#路线图">路线图</a></li>
    <li><a href="#参与贡献">参与贡献</a></li>
    <li><a href="#许可证">许可证</a></li>
    <li><a href="#联系方式">联系方式</a></li>
    <li><a href="#致谢">致谢</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## 项目简介

[![vnweb 主页][product-screenshot]](https://github.com/Halory-Ito/vnweb)

vnweb 是一个面向视觉小说与本地单机游戏整理场景的 Web 管理面板。它把本地游戏库、资料抓取、游玩记录、媒体整理、收藏分类与第三方账号联动整合到同一个界面，适合在 Windows 环境下管理自己的游戏收藏。

它不是单纯的游戏列表页面，而是一个偏「本地资料库 + 游戏启动器 + 媒体整理器」的工具，重点覆盖：

- 扫描本地目录并建立游戏库，支持多目录、层级扫描与排除规则
- 维护游戏的封面、背景、图标、徽标、PV、OST、人物、回忆与台词资料
- 自动累计游玩时长，查看统计图表、周期趋势与游玩热力图
- 用收藏夹、筛选、排序、多选批量操作快速整理大量条目
- 接入 Steam、VNDB、Bangumi、YMGal、SteamGridDB 等来源补全资料与图片
- 内置 AI 助手，通过 WebMCP 工具让模型直接操作本地游戏库（加游戏、同步角色与 PV、搜索导入 OST、导攻略、导出摘录），工具结果可渲染成可交互的生成式 UI 卡片

### 功能一览

- **主页仪表盘**：问候与日期、数据速览（近 7 天 / 连续游玩 / 总时长 / 已通关）、每日游玩时长与年度通关目标追踪（可在卡片上直接编辑）、按月切换的游玩热力图、随机摘录、最近访问
- **游戏库**：合集与收藏、多选批量操作（删除 / 加入合集 / 更新元数据 / 合并 / NSFW 标记）、多维度排序、游玩状态标签（未开始、游玩中、部分完成、已完成、多周目、搁置中）
- **游戏详情**：概览 / 相关人物 / PV / OST / 记录 / 回忆 / 摘录 / 攻略 标签页；启动与结束游戏、自动计时、评分、可执行路径与存档目录、封面 / 背景 / 图标 / 徽标设置
- **扫描与导入**：维护多个扫描目录，支持层级扫描与可执行文件扫描、扫描深度、排除路径、失败项重试、资源管理器选目录，以及多数据源搜索导入
- **媒体管理**：PV 支持 HLS、视频直链、Bilibili 短链和 YouTube 嵌入。OST 支持通过网易云搜索专辑、按 ID 导入、显示来源标签，以及通过 Meting SDK 或网易云 Enhanced API 播放曲目。回忆支持截图与 Markdown 记录。
- **台词摘录**：按角色归类、关键字与日期筛选、分页、导出 XLSX
- **游戏攻略**：从 [yjgalgame](https://www.yjgalgame.com/) 搜索导入，或按内置提示词让 AI 把攻略文本整理成 JSON 后导入；支持路线 / 结局 / 步骤、进度勾选与重置、拖拽排序、结局类型标注、角色卡片入口，以及多选批量删除
- **数据总览与报告**：统计卡片（游戏、角色、OST、PV、台词数量与时长、天数、次数）、时长与时段分布图、排行榜、周 / 月 / 年时间线、导出报告
- **外观设置**：跟随浏览器字体或导入本地字体、自定义背景图（明暗主题与移动端分开、动画样式与过渡时长）、毛玻璃模糊与透明度、图表颜色与透明度、游戏状态与攻略颜色
- **备份与同步**：本地与 WebDAV 备份、游戏结束后自动备份存档。支持 Steam、Bangumi、VNDB 和 YMGal 账号绑定，以及 Steam 游玩时长同步。
- **平台设置**：集中管理数据源凭证、Bangumi 官方与镜像地址、Meting 播放码率和封面尺寸，以及 Enhanced API 的本地 SDK、外部地址、默认音质和 `MUSIC_U`。
- **AI 助手**：WebMCP 工具发现与调用、流式对话（含思考过程折叠）、OpenAI 兼容模型配置、图片与文本文件附件，工具结果可渲染为可交互的生成式 UI（候选专辑 / 曲目 / Steam AppID 等卡片）
- **通用能力**：R18 开关、明暗主题、移动端响应式布局、全局代理设置、命令行工具

### 技术栈

- **框架**：Next.js 16（App Router / Turbopack）+ React 19 + TypeScript 5
- **数据**：TanStack Query 5、Jotai、axios
- **UI**：Tailwind CSS 4、shadcn/ui（Radix UI）、Lucide、Recharts、Motion
- **数据库**：SQLite（libSQL）+ Drizzle ORM
- **媒体与文档**：hls.js、`@meting/core`、ExcelJS、MDX、react-markdown
- **AI / WebMCP**：`usewebmcp` + `@mcp-b/webmcp-polyfill`（工具注册与浏览器运行时兜底）
- **工程质量**：oxlint、oxfmt、Vitest（browser / node）、Playwright

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- GETTING STARTED -->

## 快速开始

### 环境要求

- **Node.js ≥ 20.9**（Next.js 16 的最低要求）
- **npm**（仓库附带 `package-lock.json`）
- **Windows**：推荐。项目包含本地字体读取、游戏进程监控、本地图标提取、资源管理器选目录等能力，当前实现明显偏向 Windows 桌面环境

### Windows 一键初始化

克隆后双击根目录的 `init.bat`。脚本检查 Node.js 和 npm、安装依赖、将缺失的 JSON 从 `data/example/` 复制到 `data/settings/`，随后初始化数据库、构建项目并将项目目录加入用户 `PATH`。已有设置文件会保留。

> ⚠️ 若已存在数据库文件，脚本会先将其连同 `-wal` / `-shm` 文件移动到 `backups/db/<名称>-<时间戳>.db`，再创建一个全新的空数据库。运行前请先关闭 vnweb 服务与 Drizzle Studio。

如需手动安装，请参考下方步骤。

### 安装与配置

1. 克隆仓库

   ```sh
   git clone https://github.com/Halory-Ito/vnweb.git
   cd vnweb
   ```

2. 安装依赖

   ```sh
   npm install
   ```

3. 配置平台

   启动后在「设置 → 平台」配置 Steam、Bangumi、VNDB、YMGal、Meting SDK 和网易云 Enhanced API。平台配置写入 `data/settings/platform.json`，首次读取时自动创建。
   `data/example/` 提供四份不含凭证的配置示例。需要手动配置时，可将所需示例复制到 `data/settings/`，已有文件可参照示例补充字段。
   SteamGridDB 的密钥和接口地址可在该文件的 `steamgriddb.apiKey` 和 `steamgriddb.baseUrl` 中填写。
   VNDB OAuth 使用该文件的 `vndb.oauthClientId` 和 `vndb.oauthClientSecret`。如需覆盖默认端点或授权范围，可设置 `oauthAuthorizeUrl`、`oauthTokenUrl`、`oauthUserInfoUrl` 或 `oauthScope`。

4. 数据库路径（可选）

   默认数据库为项目根目录的 `local.db`。如需指定其他文件，在 `data/settings/general.json` 中设置 `dbFileName`，修改后重启应用。

   ```json
   { "dbFileName": "file:./local.db" }
   ```

5. 初始化数据库

   将 `db/schema.ts` 同步到所配置的 SQLite 文件：

   ```sh
   npm run db:push
   ```

   > 如需改用迁移文件，可先 `npx drizzle-kit generate` 生成，再 `npx drizzle-kit migrate` 应用。

6. 启动

   ```sh
   # 开发环境（http://localhost:3000）
   npm run dev

   # 生产环境（http://localhost:8999）
   npm run build
   npm run start
   ```

> 首次启动后打开页面，按侧边栏提示前往「扫描」建立游戏库即可。

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- USAGE EXAMPLES -->

## 使用说明

### 界面截图（更新于2026-11-21）

主页仪表盘与最近访问

![主页][screenshot-home]

扫描目录与扫描状态

![扫描页][screenshot-scan]

游戏库（文件夹布局、列表布局、网格布局、混合布局）

![游戏库页面][screenshot-game-lib]

游戏详情（资料 / 人物 / PV / OST / 记录 / 回忆 / 摘录 / 攻略）

![游戏详情页][screenshot-game]

统计总览与周期报告

![统计页][screenshot-record]

OST管理

![OST][screenshot-ost]

全屏音乐播放器

![音乐播放器][screenshot-music-player]

游戏攻略（路线 / 结局 / 步骤与进度）

![攻略页][screenshot-guide]

台词摘录（按角色归类、导出 XLSX）

![摘录页][screenshot-quote]

外观与系统设置

![设置页][screenshot-settings]

### 命令行工具

仓库根目录提供 `vnweb.bat`：不带参数会启动 Web 服务，带参数则进入命令行模式。建议把项目根目录加入 `PATH`，即可在任意位置使用 `vnweb`。

```sh
vnweb --help                     # 查看帮助
vnweb list game                  # 列出所有游戏
vnweb list g -p 2 -s 10          # 列出第 2 页，每页 10 条（list game 可简写为 list g）
vnweb list collection            # 列出所有收藏夹（简写 list c）
vnweb open 我的收藏               # 列出指定收藏夹中的游戏
vnweb search 白色相簿             # 按名称搜索游戏（支持分页 -p / -s）
vnweb start 12                   # 启动指定游戏并计时（简写 s）
vnweb start                      # 不传 ID 时，快速启动最近一次启动的游戏
```

### AI 助手与 WebMCP 工具

顶栏的 AI 助手（Bot 图标）提供三个面板：

- **对话**：OpenAI 兼容模型的流式对话，支持思考过程折叠、工具调用、图片与文本文件附件（也可直接粘贴截图）
- **WebMCP**：列出当前页面注册的 WebMCP 工具，模型可在对话中直接调用
- **配置**：添加 / 编辑模型（接口地址、API Key、模型名称、系统提示词），并可测试连接拉取模型列表

部分工具会在对话里渲染**生成式 UI**（单选候选卡片、专辑 / 曲目多选列表等），点选或确认后作为下一条用户消息发回模型，由模型继续处理。

内置的 WebMCP 工具：

| 工具                   | 说明                                                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `add_game_to_library`  | 按名称搜索并加入游戏库，自动从 SteamGridDB 配置封面、背景、图标、徽标                           |
| `sync_game_characters` | 同步指定游戏的角色信息（角色卡片与图片），可按数据源与外链 ID 绑定                              |
| `sync_game_pv`         | 同步指定游戏的 Steam 预告片；未绑定 Steam 时按游戏名搜索并把候选渲染成卡片让用户点选            |
| `search_game_ost`      | 在 khinsider / 网易云搜索 OST 专辑，返回可多选的候选卡片                                        |
| `import_game_ost`      | 导入所选 OST 专辑（整张批量或挑选曲目），已有同名专辑默认跳过                                   |
| `import_game_guide`    | 根据上传的攻略文件内容整理成攻略 JSON 并导入指定游戏（可用名称或 vndb_id 指定，已有攻略需覆盖） |
| `export_quotes_xlsx`   | 按关键词或创建时间筛选并导出摘录为 XLSX 文件                                                    |

### 常用脚本

| 命令                                         | 说明                                  |
| -------------------------------------------- | ------------------------------------- |
| `npm run dev`                                | 启动开发环境                          |
| `npm run build`                              | 构建生产版本                          |
| `npm run start`                              | 启动生产服务（端口 8999）             |
| `npm run cli`                                | 运行命令行工具（`vnweb` 的实现）      |
| `npm run lint` / `npm run lint:fix`          | 代码检查 / 自动修复                   |
| `npm run fmt` / `npm run fmt:check`          | 格式化代码 / 检查格式                 |
| `npm run db:push` / `npm run db:init`        | 同步数据库 schema（drizzle-kit push） |
| `npm run db:studio`                          | 打开 Drizzle Studio 查看数据库        |
| `npm run test` / `npm run test:run`          | 运行 Vitest 测试（watch / 单次）      |
| `npm run test:node` / `npm run test:browser` | 运行 node / browser 项目测试          |
| `npm run docs:dev`                           | 启动 VitePress 文档站点（`docs/`）    |
| `npm run docs:build`                         | 构建 VitePress 文档站点               |

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- ROADMAP -->

## 路线图

- [x] 游戏库、扫描与多数据源导入
- [x] 游戏详情（人物 / PV / OST / 记录 / 回忆 / 摘录 / 攻略）
- [x] 数据总览、周期报告与导出
- [x] 外观设置、备份与同步、AI 助手
- [x] 主页数据仪表盘（统计速览 / 游玩热力图 / 随机摘录 / 目标追踪）
- [x] WebMCP 工具（加游戏 / 同步角色与 PV / 导入 OST / 导攻略 / 导出摘录）
- [x] 生成式 UI（工具结果渲染为可交互卡片）
- [x] 攻略多选批量管理
- [ ] CG 模块
- [ ] 补丁管理（启动时选择性开关补丁）

更多想法与进度见 [Issues](https://github.com/Halory-Ito/vnweb/issues)。

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- CONTRIBUTING -->

## 参与贡献

欢迎任何形式的贡献。

1. Fork 本项目
2. 新建分支（`git checkout -b feature/AmazingFeature`）
3. 提交改动（`git commit -m 'feat: add some amazing feature'`）
4. 推送分支（`git push origin feature/AmazingFeature`）
5. 提交 Pull Request

提交前建议先跑一遍 `npm run lint`、`npm run fmt:check` 与 `npm run build`。

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- LICENSE -->

## 许可证

本仓库当前**未附带开源许可证文件**，如需在其它项目中使用或再分发，请先确认授权，或为本项目补充一个 `LICENSE`（例如 MIT）。

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- CONTACT -->

## 联系方式

Halory-Ito - [@Halory-Ito](https://github.com/Halory-Ito)

项目地址：<https://github.com/Halory-Ito/vnweb>

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## 致谢

- [VNDB](https://vndb.org/)、[Bangumi](https://bgm.tv/)、[Steam](https://store.steampowered.com/)、[YMGal](https://www.ymgal.games/)、[SteamGridDB](https://www.steamgriddb.com/) 提供游戏资料、角色与图片
- [yjgalgame](https://www.yjgalgame.com/) 提供攻略来源
- [Next.js](https://nextjs.org/)、[React](https://react.dev/)、[shadcn/ui](https://ui.shadcn.com/)、[Tailwind CSS](https://tailwindcss.com/)、[Drizzle ORM](https://orm.drizzle.team/)、[TanStack Query](https://tanstack.com/query)、[Recharts](https://recharts.org/)
- [Shields.io](https://shields.io) 提供徽章
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template) 提供 README 模板

<p align="right">(<a href="#readme-top">回到顶部</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

[forks-shield]: https://img.shields.io/github/forks/Halory-Ito/vnweb.svg?style=for-the-badge
[forks-url]: https://github.com/Halory-Ito/vnweb/network/members
[stars-shield]: https://img.shields.io/github/stars/Halory-Ito/vnweb.svg?style=for-the-badge
[stars-url]: https://github.com/Halory-Ito/vnweb/stargazers
[issues-shield]: https://img.shields.io/github/issues/Halory-Ito/vnweb.svg?style=for-the-badge
[issues-url]: https://github.com/Halory-Ito/vnweb/issues
[next-shield]: https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[next-url]: https://nextjs.org/
[react-shield]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev/
[product-screenshot]: images/主页.png
[screenshot-home]: images/主页.png
[screenshot-scan]: images/扫描页.png
[screenshot-game]: images/游戏详情页.png
[screenshot-record]: images/统计页.png
[screenshot-guide]: images/攻略页.png
[screenshot-quote]: images/摘录页.png
[screenshot-settings]: images/设置页.png
[screenshot-game-lib]: images/游戏库页面.png
[screenshot-ost]: images/OST管理页.png
[screenshot-music-player]: images/音乐播放器页面.png
