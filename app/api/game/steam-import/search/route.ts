import { NextRequest, NextResponse } from 'next/server'

import {
  fetchOwnedGames,
  getImportedSteamAppIdSet,
  getSteamApiKey,
  isValidSteamUid,
  normalizeSteamId,
  toSteamCoverUrl,
  toSteamIconUrl,
  toSteamLogoUrl,
} from '../_shared'
import { getEnabledProxySettings } from '@/lib/settings/proxy-settings'

export const maxDuration = 300

const searchSteamOwnedGames = async (req: NextRequest) => {
  try {
    const body = (await req.json().catch(() => ({}))) as { steamId?: string }
    const steamId = normalizeSteamId(body.steamId)

    if (!isValidSteamUid(steamId)) {
      return NextResponse.json(
        { error: '请输入有效的 Steam UID（17 位数字）' },
        { status: 400 },
      )
    }

    const steamApiKey = getSteamApiKey()
    if (!steamApiKey) {
      return NextResponse.json(
        { error: '未配置 STEAM_API_KEY，无法搜索' },
        { status: 500 },
      )
    }

    // 获取启用的代理配置
    const proxySettings = await getEnabledProxySettings()
    const ownedGames = await fetchOwnedGames(
      steamId,
      steamApiKey,
      proxySettings ?? undefined,
    )
    const importedAppIdSet = await getImportedSteamAppIdSet()

    const items = ownedGames
      .map((item) => {
        const appId = Number(item.appid)
        if (!Number.isInteger(appId) || appId <= 0) {
          return null
        }

        return {
          appid: appId,
          name: (item.name || '').trim() || `Steam App ${appId}`,
          playtimeMinutes: Math.max(0, Number(item.playtime_forever ?? 0)),
          coverUrl: toSteamCoverUrl(appId),
          iconUrl: toSteamIconUrl(appId, item.img_icon_url),
          logoUrl: toSteamLogoUrl(appId, item.img_logo_url),
          alreadyImported: importedAppIdSet.has(appId),
        }
      })
      .filter(
        (
          item,
        ): item is {
          appid: number
          name: string
          playtimeMinutes: number
          coverUrl: string
          iconUrl: string
          logoUrl: string
          alreadyImported: boolean
        } => item !== null,
      )

    return NextResponse.json({
      data: {
        total: items.length,
        items,
      },
    })
  } catch (error) {
    console.error('Search Steam owned games failed:', error)
    return NextResponse.json(
      { error: (error as Error).message || 'Steam 搜索失败' },
      { status: 500 },
    )
  }
}

export { searchSteamOwnedGames as POST }
