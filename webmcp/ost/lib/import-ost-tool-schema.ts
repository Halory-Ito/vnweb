// 「导入游戏 OST 专辑」WebMCP 工具的定义
export const IMPORT_OST_TOOL_NAME = 'import_game_ost'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const importOstToolInputSchema = {
  type: 'object',
  properties: {
    game: {
      type: 'string',
      description:
        '目标游戏：游戏名称（中文名 / 原名 / 别名均可）或 vndb_id（如 v184）；工具会自动在游戏库中匹配',
    },
    source: {
      type: 'string',
      description: '音源：khinsider 或 netease；应与 search_game_ost 返回的专辑 source 一致',
    },
    albumId: {
      type: 'string',
      description:
        '单张专辑 ID：netease 为数字专辑 id（如 12345），khinsider 为专辑页 slug 或完整 URL（直接用 search_game_ost 返回的 id 即可）。只传 albumId 且不传 songIndexes 时【不会写库】，而是返回曲目选择卡片让用户勾选',
    },
    albumIds: {
      type: 'array',
      items: { type: 'string' },
      description:
        '多张专辑 ID（一次导入多张）：把 search_game_ost 返回的、用户在卡片上勾选的 id 全部放进这个数组，工具会逐张拉取并导入每张专辑的【全部曲目】。可与 albumId 同时给，重复项会自动去重',
    },
    songIndexes: {
      type: 'array',
      items: { type: 'number' },
      description:
        '要导入的曲目序号（从 1 开始，与曲目选择卡片顺序一致）；仅在【只导入单张专辑】（传 albumId）时有效，多张专辑（albumIds）一律整张导入',
    },
    allowDuplicate: {
      type: 'boolean',
      description:
        '默认 false：该游戏已有同名 OST 时会跳过并在结果里回报 already-imported；只有当用户明确要求「再导一次」时才传 true',
    },
  },
  required: ['game', 'source'],
} as const
