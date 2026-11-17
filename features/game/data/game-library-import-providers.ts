export const GAME_LIBRARY_IMPORT_PROVIDERS = [
  {
    id: 'steam',
    label: 'Steam',
    enabledKey: 'steamEnabled',
    description: '先搜索 Steam 游戏库，再勾选并导入；会同时导入游玩时长。',
  },
  {
    id: 'bangumi',
    label: 'Bangumi',
    enabledKey: 'bangumiEnabled',
    description: '必须先绑定 Bangumi 账号，然后从该账号的游戏收藏中导入。',
  },
  {
    id: 'vndb',
    label: 'VNDB',
    enabledKey: 'vndbEnabled',
    description: '必须先绑定 VNDB 账号，然后从 My Visual Novel List 中导入。',
  },
  {
    id: 'ymgal',
    label: 'YMGal',
    enabledKey: 'ymgalEnabled',
    description: '必须先绑定 YMGal 账号，然后从用户的游戏列表中导入。',
  },
] as const

export type GameLibraryImportProvider = (typeof GAME_LIBRARY_IMPORT_PROVIDERS)[number]['id']
