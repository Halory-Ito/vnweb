// 「同步游戏角色信息」WebMCP 工具的定义
export const SYNC_CHARACTERS_TOOL_NAME = 'sync_game_characters'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const syncCharactersToolInputSchema = {
  type: 'object',
  properties: {
    game: {
      type: 'string',
      description:
        '目标游戏：游戏名称（中文名 / 原名 / 别名均可）或 vndb_id（如 v184）；工具会自动在游戏库中匹配',
    },
    source: {
      type: 'string',
      description:
        '角色数据源 id（如 vndb、bangumi、ymgal，取决于已启用的插件）；留空时自动使用该游戏已绑定的数据源',
    },
    externalId: {
      type: 'string',
      description:
        '该数据源中的游戏 ID（如 vndb 的 v184 或 184、bangumi 的 subject/12345）；留空时使用游戏已绑定的外部 ID。未同时指定 source 时按 vndb 处理',
    },
    saveImagesToLocal: {
      type: 'boolean',
      description: '是否把角色图片下载到本地，默认 false；设为 true 会明显变慢',
    },
  },
  required: ['game'],
} as const
