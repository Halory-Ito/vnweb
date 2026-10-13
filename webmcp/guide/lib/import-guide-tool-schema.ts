// 「生成并导入游戏攻略」WebMCP 工具的定义
export const IMPORT_GUIDE_TOOL_NAME = 'import_game_guide'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const importGuideToolInputSchema = {
  type: 'object',
  properties: {
    game: {
      type: 'string',
      description:
        '目标游戏：游戏名称（中文名 / 原名 / 别名均可）或 vndb_id（如 v184）；工具会自动在游戏库中匹配',
    },
    guide: {
      type: 'object',
      description:
        '整理好的攻略数据，结构：{ name: { "zh-cn": 必填, "en-us"?, "ja-jp"? }, level?, tips?, routes: [{ name, endings: [{ name, type?: normal|bad|good|true, requirements?, steps: [{ type?: choice|save|load|note, content, prefix?, subfix?, group? }] }] }] }',
      additionalProperties: true,
    },
    overwrite: {
      type: 'boolean',
      description: '目标游戏已有攻略时是否覆盖；默认 false，工具会先返回「已有攻略」的提示',
    },
  },
  required: ['game', 'guide'],
} as const
