import { and, eq } from 'drizzle-orm'

import { GameIdMapTable, ThirdPartyAccountTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export type ThirdPartyProvider = 'steam' | 'bangumi' | 'vndb' | 'ymgal'

export const getBoundThirdPartyAccount = async (
  provider: ThirdPartyProvider,
) => {
  const rows = await db
    .select({
      accountId: ThirdPartyAccountTable.accountId,
      accessToken: ThirdPartyAccountTable.accessToken,
      refreshToken: ThirdPartyAccountTable.refreshToken,
      expiresAt: ThirdPartyAccountTable.expiresAt,
    })
    .from(ThirdPartyAccountTable)
    .where(eq(ThirdPartyAccountTable.provider, provider))
    .limit(1)

  return rows[0] ?? null
}

export const getImportedExternalIdSet = async (
  provider: ThirdPartyProvider,
) => {
  const rows = await db
    .select({ externalId: GameIdMapTable.externalId })
    .from(GameIdMapTable)
    .where(eq(GameIdMapTable.provider, provider))

  return new Set(
    rows
      .map((row) => row.externalId.trim())
      .filter((externalId) => externalId.length > 0),
  )
}

export const hasImportedExternalId = async (
  provider: ThirdPartyProvider,
  externalId: string,
) => {
  const rows = await db
    .select({ id: GameIdMapTable.id })
    .from(GameIdMapTable)
    .where(
      and(
        eq(GameIdMapTable.provider, provider),
        eq(GameIdMapTable.externalId, externalId),
      ),
    )
    .limit(1)

  return Boolean(rows[0])
}
