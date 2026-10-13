// 「搜索游戏并加入游戏库」WebMCP 工具的定义
export const ADD_GAME_TOOL_NAME = 'add_game_to_library'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const addGameToolInputSchema = {
  type: 'object',
  properties: {
    keyword: {
      type: 'string',
      description: '游戏名称关键词，用于在数据源中搜索',
    },
    provider: {
      type: 'string',
      description: '数据源 id，例如 vndb、bangumi、steam、steamgriddb；留空时默认使用 vndb',
    },
    externalId: {
      type: 'string',
      description: '已知的数据源游戏 ID；提供后将跳过搜索，直接使用该 ID',
    },
    imageSource: {
      type: 'string',
      description: '图片来源，默认 steamgriddb（SteamGrid DB），用于获取封面、背景、图标和徽标',
    },
  },
  required: ['keyword'],
} as const
