import axios from 'axios'
import { and, eq, sql } from 'drizzle-orm'

import { getBoundThirdPartyAccount } from '@/app/api/game/third-party-import/_shared'
import { GameIdMapTable, GameInfoTable, GamePlayTable, GameStatusPushTable } from '@/db/schema'
import { db } from '@/lib/drizzle'
import {
  bangumiCharacterProviderInfo,
  vndbCharacterProviderInfo,
} from '@/lib/providers/characters/metadata'
import { readGameStatusMappings } from '@/lib/server/game-status-mappings'
import { runGameStatusTransaction } from '@/lib/server/game-status-settings'
import { readPlatformSettings, resolveBangumiEndpoints } from '@/lib/server/platform-settings'
import {
  GAME_STATUS_SYNC_OPTIONS,
  GAME_STATUS_SYNC_PROVIDERS,
} from '@/lib/settings/game-status-sync'

import type { GameStatusSyncProvider, GameStatusSyncResult } from '@/types'

async function pushStatus(
  provider: GameStatusSyncProvider,
  externalId: string,
  target: number,
  token: string,
) {
  const settings = await readPlatformSettings()
  const config = { timeout: 10000, maxRedirects: 0, headers: { 'User-Agent': 'vnweb/1.0' } }
  if (provider === 'bangumi') {
    if (settings.bangumi.useMirror && !settings.bangumi.mirrorUrl.trim()) {
      throw new Error('请先填写 Bangumi API 镜像地址')
    }
    const { apiUrl } = resolveBangumiEndpoints(settings.bangumi)
    await axios.post(
      `${apiUrl}/v0/users/-/collections/${externalId}`,
      { type: target },
      {
        ...config,
        headers: { ...config.headers, Authorization: `Bearer ${token}` },
      },
    )
    return
  }
  const baseUrl = settings.vndb.baseUrl.replace(/\/+$/, '')
  await axios.patch(
    `${baseUrl}/ulist/${externalId}`,
    {
      labels_set: [target],
      labels_unset: GAME_STATUS_SYNC_OPTIONS.vndb.flatMap(({ value }) =>
        value === target ? [] : [value],
      ),
    },
    { ...config, headers: { ...config.headers, Authorization: `Token ${token}` } },
  )
}

function resolveEntry(
  provider: GameStatusSyncProvider,
  bindings: { provider: string; externalId: string }[],
) {
  const { normalizeExternalId } =
    provider === 'bangumi' ? bangumiCharacterProviderInfo : vndbCharacterProviderInfo
  const ids = [
    ...new Set(
      bindings
        .filter((binding) => binding.provider.trim().toLowerCase() === provider)
        .map(({ externalId }) => normalizeExternalId(externalId)),
    ),
  ]
  const validId = provider === 'bangumi' ? /^[1-9]\d*$/ : /^v[1-9]\d*$/
  return ids.length === 1 && validId.test(ids[0]) ? ids[0] : undefined
}

export async function bindGameStatusSyncEntry(
  gameId: number,
  provider: GameStatusSyncProvider,
  externalId: string,
) {
  const entry = resolveEntry(provider, [{ provider, externalId }])
  if (!entry) return 'invalid-entry'

  return db.transaction(async (tx) => {
    const [game] = await tx
      .select({ id: GameInfoTable.id })
      .from(GameInfoTable)
      .where(eq(GameInfoTable.id, gameId))
      .limit(1)
    if (!game) return 'missing-game'

    await tx
      .delete(GameIdMapTable)
      .where(
        and(
          eq(GameIdMapTable.gameId, gameId),
          sql`lower(trim(${GameIdMapTable.provider})) = ${provider}`,
        ),
      )
    await tx.insert(GameIdMapTable).values({ gameId, provider, externalId: entry })
    return 'bound'
  })
}

async function readSyncConfiguration(gameId: number) {
  const [mappings, bindings] = await Promise.all([
    readGameStatusMappings(),
    db
      .select({ provider: GameIdMapTable.provider, externalId: GameIdMapTable.externalId })
      .from(GameIdMapTable)
      .where(eq(GameIdMapTable.gameId, gameId)),
  ])
  return {
    mappings,
    platforms: GAME_STATUS_SYNC_PROVIDERS.map((provider) => ({
      provider,
      entry: resolveEntry(provider, bindings),
    })),
  }
}

export async function readGameStatusSyncAvailability(gameId: number) {
  const { mappings, platforms } = await readSyncConfiguration(gameId)
  const pushes = await db
    .select()
    .from(GameStatusPushTable)
    .where(eq(GameStatusPushTable.gameId, gameId))
  return Promise.all(
    platforms.map(async ({ provider, entry }) => {
      const account = await getBoundThirdPartyAccount(provider)
      const push = pushes.find(
        (row) =>
          row.provider === provider &&
          row.accountId === account?.accountId &&
          row.externalId === entry,
      )
      const statusMappings = Object.entries(mappings).filter(
        ([, mapping]) => mapping[provider] != null,
      )
      return {
        provider,
        linked: Boolean(entry),
        accountBound: Boolean(account?.accessToken),
        mappedStatuses: statusMappings.map(([id]) => Number(id)),
        pushedStatuses: push
          ? statusMappings
              .filter(([, mapping]) => mapping[provider] === push.target)
              .map(([id]) => Number(id))
          : [],
        pushedAt: push?.pushedAt,
      }
    }),
  )
}

const pendingSyncs = new Map<string, Promise<GameStatusSyncResult>>()

export async function syncSavedGameStatus(
  gameId: number,
  provider: GameStatusSyncProvider,
  expectedStatus: number,
) {
  const key = `${gameId}:${provider}`
  const pending = Promise.resolve(pendingSyncs.get(key))
    .catch(() => undefined)
    .then(async (): Promise<GameStatusSyncResult> => {
      const [[play], { mappings, platforms }] = await Promise.all([
        db
          .select({ status: GamePlayTable.status })
          .from(GamePlayTable)
          .where(eq(GamePlayTable.gameId, gameId))
          .limit(1),
        readSyncConfiguration(gameId),
      ])
      if (play?.status !== expectedStatus)
        return { provider, success: false, error: '游玩状态已变更，请刷新后重试' }
      const target = mappings[play.status]?.[provider]
      if (!target) return { provider, success: false, error: '请先配置当前状态的平台映射' }
      const entry = platforms.find((platform) => platform.provider === provider)?.entry
      if (!entry) return { provider, success: false, error: '请先关联有效的平台条目' }
      return syncPlatform(gameId, provider, entry, target)
    })
  pendingSyncs.set(key, pending)
  try {
    return await pending
  } finally {
    if (pendingSyncs.get(key) === pending) pendingSyncs.delete(key)
  }
}

async function syncPlatform(
  gameId: number,
  provider: GameStatusSyncProvider,
  entry: string,
  target: number,
): Promise<GameStatusSyncResult> {
  try {
    const account = await getBoundThirdPartyAccount(provider)
    if (!account?.accessToken) return { provider, success: false, error: '请先绑定平台账号' }
    await pushStatus(provider, entry, target, account.accessToken)
    return recordSuccessfulPush(gameId, provider, account.accountId, entry, target)
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      return {
        provider,
        success: false,
        error: error instanceof Error ? error.message : '同步失败',
      }
    }
    const status = error.response?.status
    const message =
      status === 401 || status === 403
        ? '授权无效或缺少收藏写入权限'
        : status
          ? `平台接口返回 HTTP ${status}`
          : '无法连接平台接口'
    return { provider, success: false, error: message }
  }
}

async function recordSuccessfulPush(
  gameId: number,
  provider: GameStatusSyncProvider,
  accountId: string,
  externalId: string,
  target: number,
): Promise<GameStatusSyncResult> {
  const receipt = { accountId, externalId, target, pushedAt: new Date().toISOString() }
  try {
    await runGameStatusTransaction(async (tx) => {
      const [game] = await tx
        .select({ id: GameInfoTable.id })
        .from(GameInfoTable)
        .where(eq(GameInfoTable.id, gameId))
        .limit(1)
      if (!game) return
      await tx
        .insert(GameStatusPushTable)
        .values({ gameId, provider, ...receipt })
        .onConflictDoUpdate({
          target: [GameStatusPushTable.gameId, GameStatusPushTable.provider],
          set: receipt,
        })
    })
    return { provider, success: true }
  } catch (error) {
    console.error('Failed to record successful game status push', error)
    return { provider, success: false, error: '平台已接收状态，但未能保存推送记录' }
  }
}
