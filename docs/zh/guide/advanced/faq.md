# 常见问题

按场景整理的 Q&A。更系统的说明请参考[安装与配置](/zh/guide/intro/installation-and-configuration)、各[功能页](/zh/guide/feats/game-library)以及[架构总览](/zh/guide/advanced/architecture)。

## 安装与启动

### Q1：运行 vnweb 需要什么环境？

Node.js 20.9 或更新版本、npm，推荐 Windows。本地目录扫描、可执行文件启动、进程计时、系统字体都依赖运行 vnweb 的电脑直接访问文件路径。详见[安装与配置](/zh/guide/intro/installation-and-configuration)。

### Q2：Windows 上一键安装做了什么？

双击 `init.bat` 会检查环境、安装依赖、从 `data/example/` 补齐 `data/settings/` 缺失配置、初始化数据库、构建生产版本，并把项目目录加入用户 `PATH`。之后在新终端运行 `vnweb` 即可，默认端口 `8999`。

### Q3：运行 `init.bat` 会丢失已有数据吗？

会重建数据库。脚本先把已有 `local.db` 及其 `-wal` / `-shm` / `-journal` 备份到 `backups/db/`，再创建空库。运行前请关闭 vnweb 服务和 Drizzle Studio，并自行另存一份备份。

### Q4：开发模式和生产模式的端口分别是多少？

`npm run dev` 默认 `http://localhost:3000`；`npm run start` 默认 `http://localhost:8999`，监听 `0.0.0.0`。生产端口由 `package.json` 的 `start` 脚本中的 `-p` 参数决定。

### Q5：数据库放在哪里，能改吗？

默认 `file:./local.db`，可在 `data/settings/general.json` 的 `dbFileName` 中修改，重启后生效。应用目录与数据目录分离时，路径由 `VNWEB_APP_DIR` 和 `VNWEB_DATA_DIR` 统一控制。

## 扫描与游戏库

### Q6：支持哪些扫描方式？

支持按目录层级扫描和按可执行文件扫描两种，可设置扫描深度、排除目录，并登记多个游戏目录。扫描配置保存在 `scanner` 表，失败记录写入 `scan_error` 表。详见[扫描与游戏库](/zh/guide/feats/game-library)。

### Q7：游戏库有几种布局？

四种：文件夹、列表、网格、混合。可设置按开发商分类、卡片标题显隐、圆角与文件夹色板。详见[外观与主题](/zh/guide/feats/custom-theme)。

### Q8：扫描到了重复游戏怎么办？

可以用游戏合并接口把多个来源条目合并到目标游戏（`POST /api/game/merge`），也可以在导入时检查是否已存在同名条目。外部 ID 去重依赖 `game_id_map` 的唯一索引。

### Q9：怎么批量修改资料或 NSFW 标记？

游戏库提供多选批量操作；API 层有 `batchUpdateGameMetadata`（可指定 provider、字段与 `replace` / `merge` / `append` 策略）和 `batchMarkNsfw`。

## 资料刮削与平台

### Q10：vnweb 支持哪些平台？

内置 5 个游戏 provider：Bangumi、Steam、SteamGridDB、VNDB、YMGal；另有 VNDB / Bangumi / YMGal 三个角色 provider。详见[平台接入与 WebMCP](/zh/guide/advanced/platform-integrations)。

### Q11：为什么要配置平台凭证？

搜索条目、导入账号收藏、同步角色和推送状态都需要平台侧授权。凭证统一写在 `data/settings/platform.json`，模板在 `data/example/platform.json`，在「设置 → 平台」中填写即可。

### Q12：Bangumi 现在用 OAuth 吗？

不需要。Bangumi 已改为**个人令牌**绑定，并移除了 OAuth 配置与授权接口；令牌获取地址支持镜像配置。

### Q13：VNDB Token 是必须的吗？

读取作品与角色资料通常不需要 Token；写入状态时需要相应权限，配置前请检查 Token 的写入权限范围。VNDB OAuth 已不再依赖环境变量。

### Q14：图片加载失败怎么办？

检查网络与图床可达性；可尝试把角色图片保存到本地。配置远程图片时，`next.config.ts` 允许 http/https 任意主机；服务端也提供图片代理路由。

## 启动与记录

### Q15：怎么启动游戏？

在 Web 界面的游戏详情中设置可执行文件路径后点击启动；或用命令行 `vnweb start <游戏ID>`。命令行要求绝对路径，省略 ID 时启动最近一次游玩的游戏。详见[启动与游玩记录](/zh/guide/feats/play-records)与[命令行工具](/zh/guide/feats/other)。

### Q16：计时怎么结束并保存？

命令行计时界面按 **`q`** 结束并保存；`Ctrl+C` 会直接退出，**不会**保存本次计时。

### Q17：能把游玩状态同步到 Bangumi / VNDB 吗？

可以。先在平台设置中配置本地状态到平台状态的多对一映射，切换状态后立即保存，并可手动按平台同步。推送记录保存在 `game_status_push` 表。

## 攻略、摘录与回忆

### Q18：攻略导入格式是什么？

支持平台搜索导入和 JSON 导入。JSON 必须包含 `name.zh-cn` 和 `routes`，每条路线至少一个结局、每个结局至少一个步骤。界面内置「格式说明 & AI 提示词」。详见[攻略与路线进度](/zh/guide/feats/walkthroughs)。

### Q19：台词能导出表格吗？

可以。在全局「摘录」页点击「导出 XLSX」，按游戏或筛选条件导出；桌面端会弹出原生另存为窗口。也可用 AI 工具的 `export_quotes_xlsx`。

### Q20：回忆正文支持 Markdown 吗？

支持。回忆使用 MDX / frontmatter，可写标题、引用、图片，Markdown 图片的 `alt` 会自动作为图注，还能关联 OST 配乐自动播放。详见[角色、摘录与回忆](/zh/guide/feats/game-notes)。

## 备份与同步

### Q21：游戏存档备份和应用备份是一回事吗？

不是。游戏存档备份复制各游戏的 `saveDir` 目录，由 vnweb 在退出游戏时触发；应用数据备份保存数据库、设置文件和本地资源。两者建议都开启。详见[备份、恢复与同步](/zh/guide/feats/save-backup)。

### Q22：远程同步支持哪些服务？

WebDAV 和 S3 兼容对象存储。配置统一抽象为 `SyncClient` 接口，上传前打包为 `backup.zip` 并生成 `backup-meta.json` 日期文件，下载时支持进度条与压缩包解压恢复。

### Q23：恢复会合并数据吗？

不会。恢复/导入是整体替换，操作前先核对备份日期并另存 ZIP。实现会把将被覆盖的目录先备份为 `.bak`。

### Q24：备份内容可以自选吗？

可以。游戏存档、11 类图片、视频、音频、字体都可以在备份设置和上传前统计面板中勾选。设置文件（`data/settings/*` 与 `custom.css`）始终包含在备份中。

## 主题与外观

### Q25：怎么更换字体？

在「设置 → 外观」选择本机字体并调整字号/字重，确认后应用。全局字体由 `--app-font-family` 驱动，组件不应单独指定字体族。

### Q26：主题变量写在哪里？

在「设置 → 主题」的 CSS 编辑区，用 `:root` 定义浅色、`.dark` 定义深色；也可以编辑源码中的 `app/custom.css`。详见[外观与主题](/zh/guide/feats/custom-theme)。

### Q27：无边框和原生标题栏怎么配合？

无边框开关控制组件边框表现；桌面端关闭「原生标题栏」后，Header 支持拖动与双击最大化，并显示自定义窗口按钮。该设置只影响桌面端窗口装饰。

## AI 与工具

### Q28：AI 助手必须联网吗？

取决于模型配置。可以接入 OpenAI 兼容的云服务，也可以把 `baseUrl` 指向本机运行的兼容服务。使用外部服务时，对话内容、附件和工具参数会发送到该地址，请留意隐私。详见 [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)。

### Q29：为什么模型没有调用工具？

在「WebMCP」标签确认工具已注册；使用支持 function calling 的模型；描述中写清游戏名。返回候选卡片时，需要在卡片中确认才会真正写入数据。

## 性能与故障

### Q30：页面卡顿怎么办？

避免一次性加载大量远程图片；使用骨架屏与分页；不要频繁触发全库同步。开发时注意渲染性能，避免局部状态变化导致整页重渲染。

### Q31：出现 Hydration 报错怎么办？

回忆详情页使用 MDX 渲染，历史上 `<center>` 嵌套在 `<p>` 内会触发 Hydration 报错。改用标准 Markdown 语法即可。

### Q32：修改设置后没有生效？

字号/字重需要确认应用；数据库路径修改后需要重启；平台设置读取有浏览器缓存，可刷新或按界面提示重试。

## 延伸阅读

- [什么是 vnweb](/zh/guide/intro/what-is-vnweb) · [安装与配置](/zh/guide/intro/installation-and-configuration)
- [术语表](/zh/guide/advanced/glossary) · [更新日志与路线图](/zh/guide/advanced/changelog) · [贡献指南](/zh/guide/advanced/contributing)
