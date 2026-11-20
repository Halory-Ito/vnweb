import { atomWithStorage } from 'jotai/utils'

export type PlayerFormId = 'classic' | 'liquid-glass'

export const playerFormAtom = atomWithStorage<PlayerFormId>('ost-player-form', 'classic')

export type PlayerFormMeta = {
  id: PlayerFormId
  label: string
  subtitle: string
}

export const PLAYER_FORMS: PlayerFormMeta[] = [
  {
    id: 'classic',
    label: '经典浮岛',
    subtitle: '极简线框与通透磨砂',
  },
  {
    id: 'liquid-glass',
    label: '液态玻璃',
    subtitle: '流体折射高光与晶透水滴',
  },
]

export function resolvePlayerFormId(id: string): PlayerFormId {
  if (PLAYER_FORMS.some((item) => item.id === id)) return id as PlayerFormId
  return 'classic'
}

export function getPlayerForm(id: PlayerFormId | string): PlayerFormMeta {
  const resolved = resolvePlayerFormId(id)
  return PLAYER_FORMS.find((item) => item.id === resolved) ?? PLAYER_FORMS[0]
}
