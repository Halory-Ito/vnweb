# 攻略与路线进度

vnweb 的攻略模块把一份文字攻略拆成**攻略 → 路线 → 结局 → 步骤**四级结构，每一步都可以勾选完成。这样既能照着推游戏，也能回看自己走过哪些路线、还差哪些 END。攻略同时提供全局入口（顶栏「攻略」）和游戏详情内的标签页入口。

> 阅读本页前，建议先了解[扫描与游戏库](/zh/guide/feats/game-library)与[启动与游玩记录](/zh/guide/feats/play-records)。攻略必须关联到游戏库中的条目。

## 四级结构一览

| 层级 | 数据表         | 关键字段                                                                | 含义                                        |
| ---- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------- |
| 攻略 | `game_guide`   | `gameId`、`name`、`level`、`tips`、`finished`                           | 一份完整攻略，可包含多条路线                |
| 路线 | `guide_route`  | `guideId`、`name`、`sortOrder`、`finished`                              | 角色线或章节，支持拖拽排序                  |
| 结局 | `guide_ending` | `routeId`、`name`、`type`、`requirements`、`sortOrder`                  | 具体 END，类型为 normal / bad / good / true |
| 步骤 | `guide_step`   | `endingId`、`type`、`content`、`group`、`prefix`、`subfix`、`sortOrder` | 选项、存档、读档或备注                      |

所有层级都有 `finished` 标记与 `sortOrder` 顺序；步骤的 `group` 用于按日期或章节分组（例如「7月25日」），`prefix` / `subfix` 用于标记二周目选项或 CG 回收提示。

## 导入攻略

### 方式一：搜索导入

1. 先把目标游戏加入游戏库。
2. 从顶栏打开「攻略」，点击「导入攻略」。
3. 在「搜索导入」标签按名称查询，选中匹配结果。
4. 确认攻略关联的游戏正确后提交。若该游戏已有攻略，会弹出覆盖确认，确认后才继续。

搜索调用的是服务端 `/api/guide/search`，返回条目含名称、封面、开发商、标签与路线预览。

### 方式二：JSON 导入

已有攻略文本时，切换到「JSON 导入」。展开「格式说明 & AI 提示词」可以拿到内置的整理提示词（源码位于 `features/guide/data/import-guide-prompt.md`），把游戏名和原始攻略文本填进去，让模型产出符合格式的 JSON，再粘贴提交。

#### 最小合法示例

```json
{
  "name": { "zh-cn": "美好的每一天～不连续存在～" },
  "level": 0,
  "tips": ["★为二周目会出现的选项"],
  "routes": [
    {
      "name": "由岐视点",
      "endings": [
        {
          "name": "由岐视点 END2",
          "type": "normal",
          "steps": [
            {
              "type": "choice",
              "content": "去散步好了/海事快去做自己该做的事情吧……",
              "prefix": "★",
              "group": "7月2日"
            },
            { "type": "save", "content": "SAVE 2", "group": "7月2日" },
            { "type": "load", "content": "LOAD 2" },
            {
              "type": "note",
              "content": "由岐视点 END2 后选择 It's my own Invention 开始"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 字段约束

导入时用 Zod 做结构校验（`features/guide/import-guide-schema.ts`），主要约束如下：

| 字段                                               | 必填 | 约束                                                  |
| -------------------------------------------------- | ---- | ----------------------------------------------------- |
| `name`                                             | 是   | 对象，`name['zh-cn']` 不能为空；`en-us`、`ja-jp` 可选 |
| `routes`                                           | 是   | 数组，至少 1 条路线                                   |
| `routes[].name`                                    | 是   | 非空字符串                                            |
| `routes[].endings`                                 | 是   | 数组，至少 1 个结局                                   |
| `endings[].name`                                   | 是   | 非空字符串                                            |
| `endings[].type`                                   | 否   | `normal` / `bad` / `good` / `true`，默认 `normal`     |
| `endings[].steps`                                  | 是   | 数组，至少 1 个步骤                                   |
| `steps[].content`                                  | 是   | 非空字符串                                            |
| `steps[].type`                                     | 否   | `choice` / `save` / `load` / `note`，默认 `choice`    |
| `level`                                            | 否   | 0–5 的整数                                            |
| `uid` / `vndb_id` / `seoName` / `cover` / `romaji` | 否   | 外部标识与展示信息                                    |
| `developer` / `releaseDate` / `tags` / `tips`      | 否   | 补充元数据                                            |
| `show` / `nsfw_content` / `views`                  | 否   | 展示与统计字段                                        |

::: warning 只输出纯 JSON
提示词要求模型只输出合法 JSON，不要包 markdown 代码块、注释或说明文字。如果粘贴后报"解析失败"，先检查前后是否混入了额外文字，以及引号是否为半角。
:::

也可以通过 AI 助手的 `import_game_guide` 工具把附件文本整理成结构化 JSON 并直接导入，见 [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)。

## 多攻略并存

`game_guide` 表只要求 `gameId`，没有唯一约束，因此同一游戏可以存在多份攻略，例如一份全 END 路线图、一份 CG 回收清单。使用时注意：

- 列表页（`/guide` 或游戏详情标签）展示攻略卡片，包含已完成步骤数与百分比。
- 路线/结局下拉选项支持按 `guideId` 过滤，避免把 A 攻略的路线接到 B 攻略的结局上。
- 删除支持批量：选中多份攻略后一次删除。
- 导入时若提示已有攻略，决定是覆盖原攻略还是保留两份——覆盖会替换该游戏原有攻略数据。

::: tip 什么时候该分开存
如果两份攻略的路线结构完全不同（例如「本传」与「FD」），建议保留为两份，互不覆盖；如果只是同一攻略的修订版，直接覆盖更省心。
:::

## 按步骤游玩

1. 从攻略列表或游戏详情的「攻略」标签打开攻略。进入详情页时会自动切换到对应游戏的背景图。
2. 依次选择路线和结局，查看该 END 下的步骤列表。
3. 跟随选项、存档（`save`）、读档（`load`）和备注（`note`）步骤，完成一项就勾选一项。
4. 路线和结局页会显示各自的完成进度。也可以在相应层级使用「全部完成」或「重置进度」批量操作。
5. 进度更新通过 `PATCH /api/guide/{gameId}/progress` 提交，参数为 `type`（`step` / `ending` / `route` / `guide`）、`id` 与 `finished`。

### 进度反馈

进度条按完成度分段着色，超过 75% 和 100% 时有更明显的视觉反馈；100% 完成时卡片会显示完成态边框与徽标。颜色分段大致如下：

| 完成度 | 语义色          |
| ------ | --------------- |
| 100%   | emerald（完成） |
| ≥ 75%  | sky             |
| ≥ 50%  | amber           |
| > 0%   | rose            |
| 0%     | muted（未开始） |

顶部工具栏支持调整卡片网格列数、按行分页，并可按自定义颜色区分步骤类型。响应式布局会在窄屏下收起部分工具项。

### 补正与排序

- 在对应层级新增或编辑路线、结局、步骤。
- 路线支持拖拽排序，保存时通过 `PATCH /api/guide/route/sort` 提交新的 `sortOrder`。
- 调整顺序后，重新核对存档/读档提示的先后关系，避免照着攻略走错分支。

## 排错

| 现象                                  | 处理方式                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------- |
| 提示 `name["zh-cn"] 不能为空`         | 在 JSON 顶层补全 `name.zh-cn`                                              |
| 提示 `routes 不能为空数组`            | 至少写一条路线                                                             |
| 提示 `endings` / `steps 不能为空数组` | 每个路线至少一个结局、每个结局至少一个步骤                                 |
| 提示 `content 不能为空`               | 检查是否有只写了 `type` 却漏写内容的步骤                                   |
| 出现覆盖确认                          | 该游戏已有攻略；确认覆盖或取消后另存为不同游戏                             |
| 路线拖拽后顺序未保存                  | 等待请求完成后再刷新；检查网络或服务端日志                                 |
| 进度勾选后未持久化                    | 确认没有在请求完成前关闭页面；检查 `/api/guide/{gameId}/progress` 是否报错 |
| 步骤前缀/分组不显示                   | 检查 `prefix`、`group` 字段是否填写并被正确导入                            |

::: danger 剧透提醒
攻略默认展示完整路线与结局信息。如果要按游玩进度隐藏剧透，目前需要自行避免在未到达的路线页停留；按进度控制显示的 GraphRAG 方案仍在[路线图](/zh/guide/advanced/changelog)的拟议阶段。
:::

## 延伸阅读

- [什么是 vnweb](/zh/guide/intro/what-is-vnweb) · [安装与配置](/zh/guide/intro/installation-and-configuration)
- [角色、摘录与回忆](/zh/guide/feats/game-notes) · [启动与游玩记录](/zh/guide/feats/play-records)
- [外观与主题](/zh/guide/feats/custom-theme) · [AI 助手与 WebMCP](/zh/guide/feats/ai-assistant)
- [API 与数据层](/zh/guide/advanced/api-and-data) · [常见问题](/zh/guide/advanced/faq)
