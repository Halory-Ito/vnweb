import { getBoundThirdPartyAccount } from '@/app/api/game/third-party-import/_shared'
import { readConfig } from '@/lib/server/config-rw'
import {
  getCategoriesForPlatform,
  getPlatformFeatureKey,
  isPlatformConfigVisible,
  isPlatformFeatureEnabled,
  type PlatformFeatureCategory,
  type PlatformVisibility,
  type PlatformVisibilityKey,
} from '@/lib/settings/platform-visibility'

type AccountProvider = 'steam' | 'bangumi' | 'vndb' | 'ymgal'

const isAccountProvider = (key: PlatformVisibilityKey): key is AccountProvider =>
  key === 'steam' || key === 'bangumi' || key === 'vndb' || key === 'ymgal'

/** 在服务端校验指定平台（或具体功能分类下）是否已在「设置 → 平台」中开启。 */
export async function isPlatformEnabledOnServer(
  key: PlatformVisibilityKey,
  category?: PlatformFeatureCategory,
): Promise<boolean> {
  const { settings } = await readConfig()
  const visibility = (settings as { platformVisibility?: PlatformVisibility })?.platformVisibility

  if (category) {
    const featureValue = visibility?.[getPlatformFeatureKey(category, key)]
    if (typeof featureValue === 'boolean') return featureValue

    const legacyValue = visibility?.[key]
    if (typeof legacyValue === 'boolean') return legacyValue
  } else {
    const categories = getCategoriesForPlatform(key)
    const allExplicit =
      categories.length > 0 &&
      categories.every((cat) => typeof visibility?.[getPlatformFeatureKey(cat, key)] === 'boolean')
    if (allExplicit) {
      return isPlatformConfigVisible(key, visibility, () => false)
    }
    if (typeof visibility?.[key] === 'boolean' && !isAccountProvider(key)) {
      return visibility[key]
    }
  }

  let hasBound = false
  if (isAccountProvider(key)) {
    hasBound = Boolean(await getBoundThirdPartyAccount(key))
  }
  const hasBoundAccount = (provider: AccountProvider) => provider === key && hasBound

  if (category) {
    return isPlatformFeatureEnabled(category, key, visibility, hasBoundAccount)
  }
  return isPlatformConfigVisible(key, visibility, hasBoundAccount)
}
