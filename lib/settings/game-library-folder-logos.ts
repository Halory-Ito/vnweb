import { atom } from 'jotai'
import { atomWithStorage, unstable_withStorageValidator } from 'jotai/utils'
import { createJSONStorage } from 'jotai/vanilla/utils'

import { isAppearanceImageSource } from './appearance-image'

type FolderLogos = Record<string, string>

const storedLogos = atomWithStorage<FolderLogos>(
  'vnweb.layout.game-library-folder-logos',
  {},
  unstable_withStorageValidator(
    (value): value is FolderLogos =>
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      Object.values(value).every(isAppearanceImageSource),
  )(createJSONStorage<unknown>(() => window.localStorage)),
)

export const folderLogosAtom = atom(
  (get) => get(storedLogos),
  (get, set, href: string, source?: string) => {
    const next = { ...get(storedLogos) }
    if (source === undefined) {
      delete next[href]
    } else {
      if (!isAppearanceImageSource(source)) throw new Error('图片地址无效。')
      next[href] = source
    }
    if (JSON.stringify(next).length > 1_800_000)
      throw new Error('LOGO 占用空间过大，请先移除部分图片。')
    set(storedLogos, next)
  },
)
