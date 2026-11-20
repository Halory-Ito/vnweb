# VNWeb UI 设计系统与页面样式规范（DESIGN.md）

本文档提炼自项目现有界面的视觉基因与工程实践，旨在为 **后续新增页面、模块与组件** 提供一套可直接参考、复制与落地的通用样式指南。

---

## 1. 核心设计原则

1. **Outlined 线框优先（Outlined-First）**
   - 卡片、按钮、徽标、输入控件与容器默认采用 **带描边的线框风格（`variant="outline"`）**，用 `1px` / `2px` 边框与极轻量的 `shadow-xs` 替代厚重的实心色块与大阴影。
   - 在亮色模式下保持干净克制；在暗色与动态背景模式下通过半透明表面（`dark:bg-input/30 dark:border-input`）保持通透感。
2. **扁平层级，严禁嵌套卡片（No Nested Cards）**
   - 一个视觉区块只允许有一层带边框的 `Card` 或外框容器（包括 `DialogContent`、`DrawerContent`）。
   - 容器内部的子区块请使用 **分割线（`divide-y divide-border/50`、`border-b`）**、**弱底色块（`bg-muted/20` ~ `bg-muted/40 rounded-xl p-4`）** 或 **间距（`space-y-4`）** 来组织，切勿在卡片内再套一层 `Card`。
3. **信息极简，拒绝冗余描述（Minimal Content）**
   - 避免在卡片、表头或设置项中堆砌无实际信息量的 `secondary` 辅助说明文字；让标题、图标、核心数据与状态标签直接对话。
4. **双端原生级响应式（Desktop & Mobile First-Class）**
   - 桌面端充分利用悬停微交互（`md:group-hover:*`）、多列栅格与键盘快捷键；移动端保证 `320px ~ 767px` 下零横向溢出、触控目标充足（`>= 36px/40px`），并将桌面端仅悬停可见的关键信息转化为移动端常驻或点按直达。
5. **克制而有温度的拟物点缀（Tactile & Thematic Accents）**
   - 基础管理与数据视图保持极简效率；涉及核心收藏体验（封面、唱片、视频、手账摘录）的舞台区，可结合 CSS 3D 透视、胶片/黑胶纹理或柔和糖果色点缀提升沉浸感。

---

## 2. 色彩与表面令牌（Color & Surface Tokens）

项目基于 **Tailwind CSS v4**（`@theme inline`）与 **OKLCH 语义变量**。编写样式时**必须使用语义类名**，严禁硬编码 `#fff`、`bg-zinc-900` 等脱离主题的静态色值（特定拟物材质如黑胶唱片纹理除外）。

### 2.1 基础表面与文本语义表

| 场景用途                         | 标准 Tailwind 类名组合                                                                                       | 视觉说明                                                   |
| :------------------------------- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------- |
| **标准 Outlined 卡片/容器**      | `<Card variant="outline">` 或 `rounded-xl border bg-background shadow-xs dark:bg-input/30 dark:border-input` | 页面中最核心的承载容器，自适应亮暗色与毛玻璃背景           |
| **强调型舞台/展台外框**          | `rounded-2xl border-2 bg-muted/20 p-4 sm:p-6`                                                                | 用于页面顶部主视觉区、展示台或重点交互区                   |
| **卡片内部次级区块**             | `rounded-xl bg-muted/30 p-3 sm:p-4`（无外框或仅 `border-dashed`）                                            | 用于在 Card 或 Dialog 内部划分预览区、说明区，替代嵌套卡片 |
| **悬浮毛玻璃胶囊/工具栏**        | `bg-background/85 backdrop-blur-xs border shadow-xs`（或 `/95 backdrop-blur`）                               | 用于图片/卡片右上角悬浮操作组、底部多选悬浮栏              |
| **主文本 / 次要文本 / 弱化文本** | `text-foreground` / `text-muted-foreground` / `text-muted-foreground/70`                                     | 严格区分标题正文、元数据（时间/单位/副标题）与角落辅助字   |
| **激活 / 选中高亮态**            | `border-primary bg-primary/5 text-primary`（或导航 `bg-primary/10 dark:bg-primary/20`）                      | 用于列表中当前选中的卡片、激活的导航项或筛选标签           |
| **悬停交互反馈（列表行）**       | `hover:bg-accent/50 transition-colors`（或 `hover:bg-muted/40`）                                             | 用于排行榜行、下拉列表项、步骤行的柔和悬停高亮             |
| **危险 / 删除操作**              | `text-destructive hover:text-destructive` 或 `<Button variant="destructive">`                                | 用于删除按钮、错误提示与二次确认弹窗主按钮                 |

### 2.2 状态与柔和点缀色板（Pastel Semantic Palette）

当页面需要为不同分类、状态、空状态图标或标签赋予色彩区分时，统一采用 **低饱和度半透明边框 + 浅底色 + 对应色相文字** 的三段式写法（兼容亮/暗模式）：

- **Rose（玫瑰红/情感/收藏）**：`border-rose-300/60 bg-rose-50/50 text-rose-500 dark:border-rose-400/30 dark:bg-rose-950/20 dark:text-rose-300`
- **Sky（天青蓝/媒体/信息）**：`border-sky-300/60 bg-sky-50/50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-950/20 dark:text-sky-300`
- **Emerald（翡翠绿/完成/进行中）**：`border-emerald-300/60 bg-emerald-50/50 text-emerald-600 dark:border-emerald-400/30 dark:bg-emerald-950/20 dark:text-emerald-300`
- **Amber（琥珀黄/条件/警告/部分）**：`border-amber-300/60 bg-amber-50/50 text-amber-600 dark:border-amber-400/30 dark:bg-amber-950/20 dark:text-amber-300`
- **Violet（紫罗兰/特殊/多周目）**：`border-violet-300/60 bg-violet-50/50 text-violet-600 dark:border-violet-400/30 dark:bg-violet-950/20 dark:text-violet-300`

> **可配置业务色彩接入**：若新增页面包含图表、游戏状态点或攻略步骤，请直接通过 `useChartSettings()`、`useStatusColors()` 等 Hook 读取用户在「设置 - 外观」中自定义的颜色，保持全局联动。

---

## 3. 字体、字号与排版阶梯（Typography Scale）

全局字体由 CSS 变量 `--app-font-family`（默认衬线体 `serif`，可在设置中切换无衬线/等宽/自定义本地字体）驱动。新增页面请遵循以下字号与排版规范：

| 层级角色             | 标准 Tailwind 类名                                                                   | 适用场景与规范                                                                    |
| :------------------- | :----------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **舞台/横幅大标题**  | `text-xl sm:text-3xl font-bold tracking-tight`                                       | 仅用于 Hero 海报舞台（如放映厅主标题），常规页面**不设顶层大 `<h1>`**             |
| **区块/详情主标题**  | `text-lg sm:text-xl font-semibold tracking-tight`                                    | 详情页实体名称、展台主标题、空状态/错误态主标题                                   |
| **卡片/分组标题**    | `text-base font-semibold leading-none`（紧凑模式 `text-xs sm:text-sm lg:text-base`） | `CardTitle`、设置分组标题、排行榜标题                                             |
| **正文与列表主文案** | `text-sm leading-relaxed`（列表单行标题 `text-sm font-medium`）                      | 台词正文、列表项名称、表单标签、按钮默认文字                                      |
| **辅助元数据与描述** | `text-xs text-muted-foreground`                                                      | 创建日期、列表副标题、空状态引导说明、分页统计                                    |
| **微型角标与时间戳** | `text-[11px] leading-5` 或 `text-[10px]`                                             | 封面右上角胶囊角标、胶片编号 `#01`、卡片右下角日期                                |
| **统计大数字**       | `text-2xl`（移动端紧凑模式 `text-lg sm:text-xl lg:text-2xl`）                        | 数据卡片核心指标数值，单位紧跟其后使用 `text-xs sm:text-sm text-muted-foreground` |

### 排版必守铁律

1. **数字等宽对齐**：所有排行榜序号、百分比、倒计时、金额、时长与表格数字，必须加上 `tabular-nums`（如 `text-sm tabular-nums`），路径、域名、编号（`#01`）与代码使用 `font-mono`。
2. **响应式自适应截断**：在 Flex 或 Grid 子项中展示长文本时，父容器必须加 `min-w-0`，文本节点使用 `flex-1 truncate`（单行）或 `line-clamp-2`（双行），**禁止使用固定像素宽度（如 `max-w-42`）硬截断**。

---

## 4. 新增页面的标准布局模板（Page Layout Blueprints）

由于应用外壳（`AppLayout`）锁定了 `h-screen w-screen overflow-hidden`（左侧桌面 `w-24` 纯图标侧栏 + 顶部 `AppHeader`），**每一个新增页面都必须自带顶层独立滚动容器**，并且**不要在页面顶部重复渲染模块大标题 `<h1>`**（导航激活态与浏览器标签页 Title 已承担定位职责）。

### 4.1 模板 A：标准资源管理页（工具栏 + 内容区 + 分页 + 弹窗）

适用于列表、网格、卡片墙等大多数新增业务页面：

```tsx
export default function NewFeaturePage() {
  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-5 overflow-x-hidden overflow-y-scroll p-4 sm:p-5">
      {/* 1. 顶部工具栏：左搜索 + 右操作按钮 */}
      <FeatureToolArea />

      {/* 2. 主体内容区：内含 Loading 骨架屏 / Empty 空状态 / 正常列表 */}
      <FeatureContent />

      {/* 3. 底部分页栏（如采用分页模式） */}
      <Pagination ... />

      {/* 4. 新增/编辑/删除确认弹窗 */}
      <FeatureDialogs />
    </div>
  )
}
```

### 4.2 模板 B：仪表盘 / 多维数据概览页

适用于包含顶部统计条、主次双栏或分块卡片的综合页面：

```tsx
export default function NewDashboardPage() {
  return (
    <div className="max-h-[calc(100vh-80px)] w-full space-y-4 overflow-x-hidden overflow-y-auto p-3 sm:p-4">
      {/* 顶部 4 列核心指标速览（手机 2 列，桌面 4 列） */}
      <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <SimpleStatsCard compactOnMobile ... />
      </div>

      {/* 主次双栏布局（手机单栏可利用 order-* 调整优先级，宽屏 3:2 分栏） */}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">{/* 主内容区 */}</div>
        <div className="space-y-4 xl:col-span-2">{/* 侧边统计/日历/排行区 */}</div>
      </div>
    </div>
  )
}
```

### 4.3 模板 C：带多标签页（Tabs）的详情页或设置页

- **唯一滚动容器原则**：如果在 `layout.tsx` 中已经设置了 `max-h-[calc(100vh-70px)] w-full overflow-y-scroll p-4`，则内部的 `page.tsx` 与 `Tabs` **不要再加 `max-h-*`、`overflow-y-scroll` 或外层 `p-4`**，防止双滚动条与双倍内边距。
- **移动端横向可滑动 TabsList**：当标签页较多（如详情页 6~8 个标签）时，外层包裹 `-mx-4 overflow-x-auto scrollbar-none px-4 md:mx-0 md:px-0`，内部 `TabsList` 设置 `w-max dark:bg-transparent`，保证小屏可左右顺滑拨动且不撑破页面。

---

## 5. 常用栅格与响应式断点规范（Grid & Breakpoints）

新增页面排版时，请根据内容形态从以下标准栅格中选用：

1. **紧凑竖版封面网格（如游戏小卡、角色海报）**：
   - `grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-2.5 sm:gap-3`
   - 特点：列数随屏幕宽度自动伸缩，卡片填满列宽、无多余留白，320px/375px 手机端稳定展示 2 列。
2. **标准数据/统计小卡网格**：
   - `grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4`
3. **图表与排行榜双列网格**：
   - `grid grid-cols-1 gap-4 sm:grid-cols-2`
4. **单曲/条目多列网格（消除宽屏单列长条留白）**：
   - `grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3`
5. **瀑布流卡片墙（高度不一的图文/摘录卡片）**：
   - `columns-1 gap-5 sm:columns-2 lg:columns-3 xl:columns-4`（子卡片需加 `mb-5 break-inside-avoid`）。

---

## 6. 通用 UI 组件设计范式（Reusable UI Patterns）

新增页面时，以下高频功能块请直接沿用统一范式，保持全站体验一致：

### 6.1 顶部工具栏（Tool Area）

- **布局结构**：**不放页面大标题、不放重置按钮、不放下方记录数 Badge**，只保留左侧搜索框与右侧核心动作按钮，整合在同一行（移动端自动上下堆叠）：
  ```tsx
  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="relative flex-1 sm:max-w-md">
      <Input className="pr-4 pl-10" placeholder="搜索..." />
      <SearchIcon className="text-muted-foreground absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
    </div>
    <div className="flex flex-wrap items-center gap-2.5">
      <Button type="button" variant="outline">
        <PlusIcon />
        新增条目
      </Button>
    </div>
  </div>
  ```

### 6.2 卡片右上角悬浮操作胶囊（Hover Action Pill）

当卡片支持「复制 / 编辑 / 删除」等快捷操作时，避免在卡片底部常驻一排大按钮，统一采用右上角悬浮半透明胶囊（悬停或键盘聚焦时显现）：

```tsx
<div className="bg-background/95 absolute top-2.5 right-2.5 flex items-center gap-0.5 rounded-full border px-1 py-0.5 opacity-0 shadow-xs backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
  <Button type="button" size="icon-xs" variant="ghost" className="rounded-full" aria-label="编辑">
    <EditIcon className="size-3.5" />
  </Button>
  <Button
    type="button"
    size="icon-xs"
    variant="ghost"
    className="text-destructive hover:text-destructive rounded-full"
    aria-label="删除"
  >
    <Trash2Icon className="size-3.5" />
  </Button>
</div>
```

### 6.3 批量多选与底部毛玻璃悬浮栏（Batch Selection Toolbar）

若新页面支持批量管理（如批量删除、批量归类）：

1. **卡片左上角勾选圆点**：桌面端默认隐藏、悬停或选中时显现（`opacity-0 md:group-hover:opacity-100`）；移动端常驻显示以保证触屏可用。同时支持 `Ctrl / Cmd + 点击卡片` 快捷切换选中，进入选择模式后点击卡片本体直接切换选中状态。
2. **底部悬浮操作栏**：当 `selectedCount > 0` 时，在视口底部居中渲染：
   - 容器类名：`bg-background/95 fixed bottom-4 left-1/2 z-50 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-lg border p-2 shadow-lg backdrop-blur`
   - 内部按钮顺序：「删除（`variant="destructive" size="sm"`，触发 `AlertDialog` 二次确认）」→「取消（`variant="outline" size="sm"`）」→「全选（`variant="outline" size="sm"`）」→「已选择 N 项（`px-1 text-sm font-medium`）」。

### 6.4 状态反馈三件套：骨架屏、静默刷新、空状态与错误态

任何异步数据视图都必须完整处理以下 4 种状态，严禁在数据尚未返回时把空数组当作 `0` 渲染：

1. **初次加载（`isLoading`）**：使用与真实卡片/列表几何尺寸一致的 `<Skeleton />` 占位。
2. **后台静默刷新（`isRefetching`）**：保留当前内容不闪烁，在内容容器右上角叠加微型胶囊指示器：
   ```tsx
   <div className="bg-background/85 absolute top-3 right-3 z-20 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs backdrop-blur-xs">
     <Loader2Icon className="size-3 animate-spin" />
     更新中
   </div>
   ```
3. **空数据状态（Empty State）**：统一使用大圆角虚线容器 + 主题色圆形图标 + 温和颜文字标题 + 引导说明：
   ```tsx
   <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center">
     <div className="mb-3 flex size-14 items-center justify-center rounded-full border border-sky-300/60 bg-sky-50/50 text-sky-500 dark:border-sky-400/30 dark:bg-sky-950/20">
       <InboxIcon className="size-6" />
     </div>
     <p className="text-sm font-medium">(´・ω・`) 这里还没有任何记录</p>
     <p className="text-muted-foreground mt-1 text-xs">点击右上角“新增”按钮添加第一条数据吧</p>
   </div>
   ```
4. **加载失败状态（Error State）**：展示清晰的失败原因与 `<Button variant="outline">重新加载</Button>` 重试入口（重试期间按钮 `disabled` 并显示「重试中...」）。

### 6.5 弹窗与抽屉规范（Dialogs & Drawers）

- **尺寸与窄屏防溢出**：`DialogContent` 默认自适应，列表预览型弹窗使用 `sm:max-w-lg` 或 `sm:max-w-2xl`。当弹窗包含长表单或结果列表时，必须限制最大高度 `max-h-[85dvh]` 并在内容区开启 `overflow-y-auto`，确保在 `320px` 窄屏手机上左右各留 `16px` 边距且不溢出。
- **无障碍描述**：每个 `DialogHeader` / `DrawerHeader` / `SheetHeader` 必须同时包含 `Title` 与 `Description`（若界面上不需要展示副标题，使用 `<DialogDescription className="sr-only">...</DialogDescription>` 补齐，消除 Radix 可访问性告警）。
- **提交与切换保护**：异步请求进行中（`isSubmitting` / `isLoading`）时，必须禁用提交按钮、来源切换下拉框及关闭动作，并在关闭弹窗时清理或忽略过期请求结果。

---

## 7. 动效与微交互规范（Motion & Micro-interactions）

### 7.1 列表与页面交错入场（Motion Variants）

使用 `motion/react` 为新增页面或卡片网格添加入场动画时，统一复用以下缓动参数（可参考 `features/guide/data/motion.ts`）：

- **外层容器（`containerVariants`）**：`hidden: { opacity: 0 }` → `visible: { opacity: 1, transition: { staggerChildren: 0.05 ~ 0.08 } }`
- **列表项滑入（`itemVariants`）**：`hidden: { opacity: 0, y: 12 ~ 20 }` → `visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }`
- **卡片缩放淡入（`cardVariants`）**：`hidden: { opacity: 0, scale: 0.95 }` → `visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }`
- **跨路由共享元素过渡**：列表页与详情页存在同一实体（如封面、标题）时，可使用相同的 `layoutId`（配合 `type: 'spring', stiffness: 320, damping: 30`）并在悬停时调用 `router.prefetch` + `queryClient.prefetchQuery`，实现零延迟丝滑飞跃。

### 7.2 悬停与 3D 视差准则

- **常规卡片悬停**：使用轻量的上浮与边框高亮 `transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md`（移动端建议通过 `md:hover:-translate-y-1` 仅在桌面端启用位移）。
- **3D 鼠标视差（如立体盒装封面、展台封套）**：
  - 使用原生 CSS `[perspective:900px]` 与 `[transform-style:preserve-3d]`。
  - 高频鼠标移动（`pointermove`）优先通过 `requestAnimationFrame` 更新 DOM CSS 变量（如 `--cover-rotate-x/y`），避免高频触发 React `setState`。
  - **动态减弱兼容**：所有连续位移与 3D 旋转必须遵守系统无障碍设置，添加 `motion-safe:transition-transform motion-reduce:transform-none`。
  - **装饰层隔离**：高光层、胶带装饰、阴影背板、大引号水印等纯视觉元素必须添加 `aria-hidden="true"` 与 `pointer-events-none`。

---

## 8. 新增页面自检清单（New Page Checklist）

在完成任何新页面或组件的开发后，请对照以下清单逐项核验：

- [ ] **架构与行数**：单文件是否 `<= 200` 行（超过 `150` 行是否已拆分子组件）？所有 API 请求、状态管理与复杂计算是否已抽离到模块 `hooks/use-xxx.ts`？
- [ ] **Outlined 与层级**：Card、Button、Badge 是否优先使用了 `variant="outline"`？是否确保了**没有任何卡片嵌套卡片**？是否去除了多余的 `secondary` 描述文字？
- [ ] **主题与暗色适配**：是否全部使用了语义颜色类名（无硬编码颜色）？在亮色模式、暗色模式及开启深色自定义毛玻璃背景时，对比度与边框通透度是否正常？
- [ ] **多断点响应式**：在 `320px / 375px`（手机）、`768px`（平板断点）、`1280px / 1920px`（桌面）下是否均无横向滚动条溢出？长标题是否具备 `min-w-0 truncate`？
- [ ] **状态完整性**：是否完整实现了 `isLoading`（骨架屏）、`isRefetching`（右上角静默更新指示）、`isEmpty`（虚线框情感化空状态）与 `isError`（带重试按钮的错误提示）？
- [ ] **无障碍与键盘交互**：所有纯图标按钮是否有 `aria-label`？所有 `Dialog` / `Drawer` / `Sheet` 是否包含 `Title` 与 `Description`？数字列是否添加了 `tabular-nums`？
