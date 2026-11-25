# AI 助手与 WebMCP

顶栏的「AI 助手」包含三个标签：**对话**、**WebMCP** 和 **配置**。它不是预设的云端助手，而是让用户接入自己的 OpenAI 兼容模型，并通过 WebMCP 工具把模型能力落到本地资料库上。工具调用结果会以可交互的**生成式 UI 卡片**呈现，点选确认后才真正写入数据。

> 本项目对 AI 的定位是"本地优先、Agent 原生"的数字文化实验场。路线图中的多模态叙事理解、语义知识图谱与按进度防剧透的 GraphRAG 仍处于拟议阶段，详见[公开路线图](/zh/roadmap)与[更新日志与路线图](/zh/guide/advanced/changelog)。

## 配置模型

### 添加模型

1. 点击顶栏「AI 助手」，切到「配置」。
2. 添加支持 OpenAI 兼容接口的模型，填写：

   | 字段           | 说明                                       |
   | -------------- | ------------------------------------------ |
   | `name`         | 显示在配置列表中的名称                     |
   | `baseUrl`      | 接口地址，例如 `https://api.openai.com/v1` |
   | `apiKey`       | API Key；读取配置时返回脱敏占位符          |
   | `model`        | 模型名称，例如 `gpt-4o-mini`               |
   | `systemPrompt` | 可选的系统提示词                           |

3. 点击测试连接。测试会调用 `/api/agent/models` 拉取上游模型列表。
4. 保存后，把该配置设为当前模型（`activeConfigId`）。

配置可以有多条，保存在 `data/settings/general.json` 的 `agent` 节点中：

```json
{
  "agent": {
    "configs": [
      {
        "id": "uuid-...",
        "name": "本地模型",
        "baseUrl": "http://127.0.0.1:11434/v1",
        "apiKey": "",
        "model": "qwen2.5:14b"
      }
    ],
    "activeConfigId": "uuid-..."
  }
}
```

::: tip 本地模型
只要服务端实现 OpenAI 兼容的 `/chat/completions` 与 `/models`，就可以接入。把 `baseUrl` 指向本机地址即可在不上传资料的前提下试用工具调用。
:::

### 对话能力

- **流式输出**：通过 `/api/agent/chat` 的 SSE 流逐字显示回复。浏览器端 axios 无法逐块读取响应体，因此 API 层使用 `fetch` + `ReadableStream` 实现；这是封装在 `api/agent.ts` 中的请求实现，组件不直接调用 `fetch`。
- **思考过程折叠**：支持 `reasoning_content` 增量，单独渲染为可折叠区域。
- **多模态附件**：支持文本与图片附件，可以直接粘贴截图，让模型参考攻略文本或界面画面。
- **工具调用**：模型返回 `tool_calls` 后，前端将结果渲染为卡片，用户确认后回传模型继续处理。

## WebMCP 工作原理

WebMCP 让网页把自身能力注册为工具，供具备工具调用能力的 Agent 使用。

1. 运行时初始化：`ensureWebMcpRuntime()` 检查浏览器是否原生提供 `document.modelContext`，否则通过 `@mcp-b/webmcp-polyfill` 安装兜底实现。这一步必须在注册工具之前调用，且只在客户端生效。
2. 工具注册：各功能模块用 `useWebMCP` 注册工具，工具输入用 Zod schema 描述。
3. 转换为 OpenAI 工具定义：注册的工具会被转换为 `AgentToolDefinition`（`type: 'function'`），随对话请求一起发送给模型。
4. 生成式 UI：工具若返回候选条目（例如多个 OST 专辑），会渲染为可点选卡片。用户选择并确认后，请求才真正执行。

在「WebMCP」标签可以查看当前页面已注册的工具。

## 内置工具清单

当前共 7 项工具，分布在游戏、攻略、OST 与摘录四个模块中。

| 工具名                 | 所属模块 | 作用                                                                  |
| ---------------------- | -------- | --------------------------------------------------------------------- |
| `add_game_to_library`  | 游戏     | 按名称搜索并加入游戏库，自动从 SteamGridDB 配置封面、背景、图标与徽标 |
| `sync_game_characters` | 游戏     | 同步指定游戏的角色资料与立绘，支持按数据源与外链 ID 绑定              |
| `sync_game_pv`         | 游戏     | 同步 Steam 预告片；未绑定时按名称搜索并渲染候选卡片供点选             |
| `import_game_guide`    | 攻略     | 把上传的攻略文本整理为结构化 JSON 并导入指定游戏                      |
| `search_game_ost`      | OST      | 在 khinsider / 网易云搜索 OST 专辑，返回可多选的候选卡片              |
| `import_game_ost`      | OST      | 批量或挑选曲目导入所选 OST 专辑，同名专辑默认跳过                     |
| `export_quotes_xlsx`   | 摘录     | 按关键词或创建时间筛选并导出台词摘录为 XLSX                           |

### 调用示例

以下是用户描述与工具调用的对应关系（实际参数由模型生成）：

```json
{
  "name": "import_game_guide",
  "arguments": {
    "gameId": 12,
    "guideText": "……原始攻略文本……"
  }
}
```

工具执行依赖平台配置：例如 `add_game_to_library` 的图片来自 SteamGridDB，`sync_game_pv` 依赖 Steam 绑定，`sync_game_characters` 依赖 VNDB / Bangumi / YMGal 数据源。请先按[平台接入与资料更新](/zh/guide/feats/platforms)完成配置。

## 典型场景

| 想完成的任务     | 可以这样描述                                             |
| ---------------- | -------------------------------------------------------- |
| 添加游戏         | 帮我搜索《游戏名》，显示候选后把我选中的版本加入游戏库。 |
| 补全角色或预告片 | 给库里的《游戏名》同步角色，或查找它的 Steam 预告片。    |
| 搜索和导入 OST   | 搜索《游戏名》的 OST，让我选择专辑和曲目后再导入。       |
| 导入攻略         | 把附件整理成 vnweb 攻略，关联到游戏库里的《游戏名》。    |
| 导出台词         | 按关键词或创建时间筛选摘录，并导出 XLSX。                |

::: tip 描述要具体
尽量写清游戏名、平台或外部 ID。存在多个同名作品时，模型难以自行判断该选哪一个；候选卡片出现后，请核对关联游戏再确认。
:::

## 隐私与数据安全

::: danger 数据会离开本机
一旦使用外部模型服务，对话内容、附件以及工具参数会发送到你配置的 `baseUrl`。请确认该服务的隐私政策，不要输入不希望外传的私人信息。
:::

- API Key 读取时脱敏：GET `/api/agent/config` 返回占位符，保存时传占位符会沿用已保存的密钥。
- 默认本地：资料库与游玩进度留在本地；是否上传取决于显式配置与显式工具调用。
- 工具确认：返回候选卡片的写操作需要用户点选确认后才执行。
- 路线图中的安全目标包括：明确工具权限、分离读写访问、对重要变更要求确认，以及评估导入资料与攻略中可能存在的提示注入风险。详见[公开路线图](/zh/roadmap)与[更新日志](/zh/guide/advanced/changelog)。

## 排错

| 现象                     | 处理方式                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------ |
| 测试连接失败             | 核对 `baseUrl` 是否包含 `/v1`、API Key 是否有效、模型是否有 `/models` 权限           |
| 对话返回 401 / 403       | 密钥错误或额度不足；重新保存配置                                                     |
| 看不到流式输出           | 检查服务端 `/api/agent/chat` 是否返回 SSE；代理可能缓冲响应                          |
| 工具没有被模型调用       | 确认切到「WebMCP」标签能看到工具；换用支持 function calling 的模型                   |
| 工具返回候选后没有写入   | 需要在卡片中确认；仅生成候选不会落库                                                 |
| 同步类工具失败           | 检查对应平台的凭证与 ID 映射，见[平台接入](/zh/guide/advanced/platform-integrations) |
| OST 工具结果为空         | 检查网络与来源可用性；尝试更换关键词                                                 |
| 粘贴截图后模型看不到图片 | 确认所用模型支持图像输入                                                             |

## 延伸阅读

- [什么是 vnweb](/zh/guide/intro/what-is-vnweb) · [安装与配置](/zh/guide/intro/installation-and-configuration)
- [角色、摘录与回忆](/zh/guide/feats/game-notes) · [攻略与路线进度](/zh/guide/feats/walkthroughs)
- [平台接入与资料更新](/zh/guide/feats/platforms) · [命令行工具](/zh/guide/feats/other)
- [平台接入与 WebMCP](/zh/guide/advanced/platform-integrations) · [常见问题](/zh/guide/advanced/faq)
