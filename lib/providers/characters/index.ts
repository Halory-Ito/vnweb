import { bangumiCharacterProvider } from './bangumi-character-provider'
import { vndbCharacterProvider } from './vndb-character-provider'
import { ymgalCharacterProvider } from './ymgal-character-provider'

const providers = [vndbCharacterProvider, bangumiCharacterProvider, ymgalCharacterProvider]

export function getCharacterProvider(sourceId: string) {
  return providers.find((provider) => provider.sourceId === sourceId)
}
