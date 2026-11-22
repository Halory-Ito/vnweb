// 「搜索游戏 OST 专辑」WebMCP 工具的定义
export const SEARCH_OST_TOOL_NAME = 'search_game_ost'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const searchOstToolInputSchema = {
  type: 'object',
  properties: {
    game: {
      type: 'string',
      description:
        '目标游戏：游戏名称（中文名 / 原名 / 别名均可）或 vndb_id（如 v184）；工具会自动在游戏库中匹配',
    },
    keyword: {
      type: 'string',
      description:
        '显式指定搜索词（专辑名）；留空时自动使用该游戏在库中的名称搜索（优先用中文名，第一个没结果会自动换另一个再试）',
    },
    source: {
      type: 'string',
      description: '音源：meting-api（唯一音源；通过网易云搜索专辑，曲目由 Meting SDK 提供）',
    },
  },
  required: ['game'],
} as const
