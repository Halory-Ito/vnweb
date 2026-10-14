// 「同步游戏 Steam PV」WebMCP 工具的定义
export const SYNC_PV_TOOL_NAME = 'sync_game_pv'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const syncPvToolInputSchema = {
  type: 'object',
  properties: {
    game: {
      type: 'string',
      description:
        '目标游戏：游戏名称（中文名 / 原名 / 别名均可）或 vndb_id（如 v184）；工具会自动在游戏库中匹配',
    },
    steamAppId: {
      type: 'string',
      description:
        'Steam AppID（纯数字，可在 Steam 商店页地址 /app/<appid>/ 中找到）；留空时先使用游戏已绑定的 Steam AppID，仍未绑定时会自动按游戏名称搜索 Steam 商店并在对话里给出候选供用户确认',
    },
  },
  required: ['game'],
} as const
