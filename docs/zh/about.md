# 关于 vnweb

这一页回答三个问题：vnweb 是谁、为什么存在、以及它准备往哪里去。如果你想知道「怎么装、怎么用」，请从[使用文档](/zh/)、[安装与配置](/zh/guide/intro/installation-and-configuration)或[快速开始](/zh/guide/intro/quick-start)开始。

## 一句话介绍

vnweb 是**面向数字文化的开源、本地优先、Agent 原生基础设施**：从视觉小说与本地单机游戏出发，把硬盘里的游戏文件夹组织成可自托管资料库，补齐封面与元数据、记录游玩时长、整合攻略/PV/OST/回忆/台词，并在用户可控的边界下探索人与 AI Agent 协作整理数字内容。

![vnweb 游戏详情界面](/overview.png)

更完整的产品定位、适用人群和同类工具对比，写在[什么是 vnweb](/zh/guide/intro/what-is-vnweb)里；那篇还保留了我入坑视觉小说和动手做这个项目的真实缘起。

## 它从哪里来

故事从一个很普通的烦恼开始：本地视觉小说越来越多，面对的却全是文件夹。文件夹不会告诉你哪款游戏玩过多少小时，也不会告诉你封面在哪、角色是谁、上次推到哪条线。

我最早用过 PotatoVN，惊讶于原来还有这种软件，但可定制化程度不够；后来遇到 Vnite，界面和功能都丰富很多，可我仍然想要更接近「wiki 级」的垂类信息——角色、线路、音乐、攻略、台词都应该能挂在同一款游戏下面。恰逢毕业设计可以自拟题目，这事就这么开始了。

那段经历也塑造了 vnweb 的气质：既要像工具一样好用，又要足够灵活，让每个玩家按自己的方式整理「自己的那一小片叙事宇宙」。

::: tip 这不是商业产品
vnweb 是开源项目，以 AGPL-3.0 许可发布。没有账号系统、没有云端强制同步、也没有把你的游戏库当作数据的计划。
:::

## 我坚持的几个原则

### 本地优先，数据在你手里

游戏目录、可执行路径、游玩会话、设置文件都落在运行 vnweb 的电脑上。默认数据库是项目目录下的 `local.db`，配置集中在 `data/settings/`，示例文件放在 `data/example/`。你可以自由备份、导出、搬走。

### 聚合而不是占有

资料可以来自 Steam、VNDB、Bangumi、YMGal、SteamGridDB、网易云音乐等，但 vnweb 做的是「把资料收进你的库」，而不是把你绑在某一个平台上。平台凭证的用途与边界，见[平台接入与资料更新](/zh/guide/feats/platforms)。

### 记录服务于回顾

计时不是为了考核谁，而是为了让你在某个深夜打开年报时，能想起「原来那一年我花了这么多时间在这些故事上」。统计维度、报告模板与导出方式见[启动与游玩记录](/zh/guide/feats/play-records)。

### 模块边界清楚

前端按功能拆分到 `features/`，跨模块请求与类型分别收口到根级 `api/` 与 `types/`，具体请求经由 `app/api/` 下的路由提供服务端实现。这样改一个模块时，不至于牵一发动全身。想了解代码结构，读[架构总览](/zh/guide/advanced/architecture)与[API 与数据层](/zh/guide/advanced/api-and-data)。

## 技术栈一览

| 层次       | 采用的技术                                                                          |
| ---------- | ----------------------------------------------------------------------------------- |
| 框架       | Next.js 16（App Router / Turbopack）、React 19、TypeScript 5                        |
| 界面       | Tailwind CSS 4、shadcn/ui（Radix UI）、Lucide、Recharts、Motion                     |
| 数据与存储 | SQLite（libSQL）、Drizzle ORM、TanStack Query 5、Jotai、axios                       |
| 媒体与同步 | hls.js、`@meting/core`、ExcelJS、MDX / react-markdown、WebDAV、`@aws-sdk/client-s3` |
| Agent      | OpenAI 兼容接口、`usewebmcp`、可交互生成式 UI                                       |
| 桌面端     | Tauri v2、Rust CLI 入口、Windows Job Object 子进程托管                              |
| 工程工具   | oxlint、oxfmt、VitePress、`tsx`                                                     |

依赖选择上我倾向于先用现成能力：样式优先复用 shadcn/ui 与 Tailwind v4，请求优先复用项目封装的 `api` 实例，能原生实现就不额外引入库。详见[贡献指南](/zh/guide/advanced/contributing)。

## 现在能做什么

| 领域   | 已实现的能力                                                                               |
| ------ | ------------------------------------------------------------------------------------------ |
| 游戏库 | 多目录扫描、层级/可执行文件扫描、排除规则、四种布局、收藏夹、筛选排序、批量操作            |
| 资料   | Steam / VNDB / Bangumi / YMGal / SteamGridDB 刮削，Steam 时长同步，Bangumi / VNDB 状态推送 |
| 内容   | 角色与立绘、PV、OST、回忆（MDX + frontmatter）、台词摘录、攻略与路线进度                   |
| 统计   | 主页速览、目标追踪、热力图、时长分布、月报/年报、海报导出                                  |
| 外观   | 自定义字体与字号、明暗与移动端背景、毛玻璃、主题语义色、无边框、启动动画                   |
| 数据   | 存档与设置备份、ZIP 导出导入、WebDAV / S3 远程同步                                         |
| 扩展   | OpenAI 兼容 AI 助手、WebMCP 工具、命令行工具、Tauri 桌面端                                 |

逐项操作入口见[文档首页](/zh/)，功能之间可以互相跳转：比如从[游戏库](/zh/guide/feats/game-library)到[平台接入](/zh/guide/feats/platforms)，再到[游玩记录](/zh/guide/feats/play-records)。

## 接下来准备做什么

公开路线图把方向分成两类。已经完成的部分包括本地游戏库、多源资料与状态同步、详情页内容体系、统计与备份同步、AI 助手与 WebMCP。仍在推进的有：

- **游戏库**：CG 画廊；按启动选择补丁的补丁管理。
- **叙事理解**：从用户主动选择的文本与截图中抽取角色、事件与线路关系，并评估能否溯源。
- **语义知识图谱**：为作品、角色、线路、事件定义可复用 schema，保留来源出处并支持查询导出。
- **剧透感知 GraphRAG**：按玩家当前线路与进度做检索，衡量剧透泄漏、相关性与答案落地程度。
- **Agent 工作流**：更结构化的工具结果、预览与确认，评估工具选择与任务完成率。
- **隐私与安全**：外部模型请求的数据范围与目标可见、读写权限分离、提示词注入抗性评估、凭证与供应链审查。

这些是研究方向的描述，不代表具体版本承诺；详见独立[路线图页面](/zh/roadmap)、仓库 [ROADMAP.md](https://github.com/Halory-Ito/vnweb/blob/main/ROADMAP.md) 和项目 Issues。文档侧的已落地脉络整理在[更新日志](/zh/guide/advanced/changelog)。

::: warning 关于路线图
标记为「拟议/计划」的内容可能随原型与评估结果调整范围或顺序。不要在自动化流程里依赖尚未发布的接口。
:::

## 开源与许可

vnweb 使用 **GNU Affero General Public License v3.0（AGPL-3.0）**。这意味着你可以自由使用、修改和分发；如果你以网络服务形式提供修改后的版本，需要向使用者提供相应源码。完整条款见仓库根目录的 LICENSE。

我认为这个许可和 vnweb 的气质是契合的：它是一个可以自托管的工具，社区改进应该能够回流。

## 致谢

没有这些作品和项目，就不会有今天的 vnweb：

- **资料与攻略来源**：[VNDB](https://vndb.org/)、[Bangumi](https://bgm.tv/)、[Steam](https://store.steampowered.com/)、[YMGal](https://www.ymgal.games/)、[SteamGridDB](https://www.steamgriddb.com/)、[yjgalgame](https://www.yjgalgame.com/)。
- **基础设施**：[Next.js](https://nextjs.org/)、[React](https://react.dev/)、[shadcn/ui](https://ui.shadcn.com/)、[Drizzle ORM](https://orm.drizzle.team/)、VitePress。
- **更重要的是**：所有认真写故事的人，以及愿意把游玩经历认真整理下来的玩家。

## 参与进来

- 用法上有疑问：先看[常见问题](/zh/guide/advanced/faq)和[术语表](/zh/guide/advanced/glossary)。
- 遇到 Bug 或想提需求：到 GitHub Issues 描述复现步骤、系统环境与脱敏后的错误。
- 想改代码或文档：读[贡献指南](/zh/guide/advanced/contributing)，提交前跑一遍 `npm run lint`、`npm run fmt:check` 和 `npm run build`。
- 想理解平台凭证怎么配、为什么这样设计：[平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)是更好的起点。

## 小结

vnweb 是一个视觉小说爱好者写给同好的工具：本地优先、资料聚合、记录可回顾、结构可扩展。它还不完美，但每一天都在朝着「更懂视觉小说的资料库」靠近。

- 想用起来：[安装与配置](/zh/guide/intro/installation-and-configuration) → [快速开始](/zh/guide/intro/quick-start)
- 想了解设计：[什么是 vnweb](/zh/guide/intro/what-is-vnweb)
- 想参与：[贡献指南](/zh/guide/advanced/contributing)

> 秘则为花。
>
> —— 最初的关于页只有这四个字，这里保留它作为签名。
