import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

import { isAppearanceImageSource } from './appearance-image'
import { createLayoutSyncedStorage, isFolderLogos } from '@/lib/settings/layout-settings'

type FolderLogos = Record<string, string>

export const folderLogosStorageAtom = atomWithStorage<FolderLogos>(
  'vnweb.layout.game-library-folder-logos',
  {},
  createLayoutSyncedStorage('folderLogos', isFolderLogos),
)

export const folderLogosAtom = atom(
  (get) => get(folderLogosStorageAtom),
  (get, set, href: string, source?: string) => {
    const next = { ...get(folderLogosStorageAtom) }
    if (source === undefined) {
      delete next[href]
    } else {
      if (!isAppearanceImageSource(source)) throw new Error('图片地址无效。')
      next[href] = source
    }
    if (JSON.stringify(next).length > 1_800_000)
      throw new Error('LOGO 占用空间过大，请先移除部分图片。')
    set(folderLogosStorageAtom, next)
  },
)
