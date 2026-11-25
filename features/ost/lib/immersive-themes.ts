import { atomWithStorage } from 'jotai/utils'

export type ImmersiveThemeId = 'monet' | 'lumiere' | 'fume' | 'partita' | 'hanabi' | 'backdrop'

export const immersiveThemeAtom = atomWithStorage<ImmersiveThemeId>(
  'ost-player-immersive-theme',
  'monet',
)

export type ImmersiveThemeMeta = {
  id: ImmersiveThemeId
  label: string
  subtitle: string
  palette: [string, string, string, string]
}

export const IMMERSIVE_THEMES: ImmersiveThemeMeta[] = [
  {
    id: 'monet',
    label: '莫奈',
    subtitle: '海报双栏排版、油画柔光与底部频谱',
    palette: ['#7c98d6', '#d8a7b1', '#88c9bf', '#e6c786'],
  },
  {
    id: 'lumiere',
    label: '绘光',
    subtitle: '斜射体积光束、悬浮尘埃与逐字点亮',
    palette: ['#fde68a', '#fbbf24', '#93c5fd', '#f8fafc'],
  },
  {
    id: 'fume',
    label: '浮名',
    subtitle: '满屏立体景深交错、虚实烟雾与镜头推移',
    palette: ['#94a3b8', '#cbd5e1', '#64748b', '#e2e8f0'],
  },
  {
    id: 'partita',
    label: '云阶',
    subtitle: '阶梯缩进乐谱排版与秩序光阶延伸',
    palette: ['#38bdf8', '#818cf8', '#a78bfa', '#67e8f9'],
  },
  {
    id: 'hanabi',
    label: '花火',
    subtitle: '切句绽放夜空礼花与星辉字影',
    palette: ['#fb7185', '#fbbf24', '#c084fc', '#38bdf8'],
  },
  {
    id: 'backdrop',
    label: '映景',
    subtitle: '游戏详情背景柔光遮罩与电影缓动',
    palette: ['#60a5fa', '#c084fc', '#f472b6', '#38bdf8'],
  },
]

const LEGACY_MAP: Record<string, ImmersiveThemeId> = {
  streamer: 'lumiere',
  mist: 'fume',
}

export function resolveImmersiveThemeId(id: string): ImmersiveThemeId {
  if (id in LEGACY_MAP) return LEGACY_MAP[id]
  if (IMMERSIVE_THEMES.some((item) => item.id === id)) return id as ImmersiveThemeId
  return 'monet'
}

export function getImmersiveTheme(id: ImmersiveThemeId | string): ImmersiveThemeMeta {
  const resolved = resolveImmersiveThemeId(id)
  return IMMERSIVE_THEMES.find((item) => item.id === resolved) ?? IMMERSIVE_THEMES[0]
}
