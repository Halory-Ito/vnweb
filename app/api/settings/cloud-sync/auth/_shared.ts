import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

import { ThirdPartyAccountTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

export type OAuthProvider = 'bangumi' | 'vndb'

export const getAppOrigin = (req: NextRequest) => {
  return req.nextUrl.origin
}

export const makeStateCookieName = (provider: OAuthProvider) => {
  return `cloud_sync_oauth_state_${provider}`
}

export const issueOAuthState = async (provider: OAuthProvider) => {
  const state = crypto.randomUUID().replace(/-/g, '')
  const cookieStore = await cookies()
  cookieStore.set(makeStateCookieName(provider), state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 10 * 60,
  })
  return state
}

export const validateOAuthState = async (
  provider: OAuthProvider,
  stateFromQuery: string,
) => {
  const cookieStore = await cookies()
  const key = makeStateCookieName(provider)
  const stateFromCookie = cookieStore.get(key)?.value || ''

  cookieStore.set(key, '', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 0,
  })

  if (!stateFromQuery || !stateFromCookie) {
    return false
  }

  return stateFromCookie === stateFromQuery
}

export const saveThirdPartyAccount = async (
  provider: 'steam' | 'bangumi' | 'vndb',
  accountId: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: string,
) => {
  const now = dayjs().toISOString()

  await db.transaction(async (tx) => {
    await tx
      .delete(ThirdPartyAccountTable)
      .where(eq(ThirdPartyAccountTable.provider, provider))

    await tx.insert(ThirdPartyAccountTable).values({
      provider,
      accountId,
      accessToken,
      refreshToken,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    })
  })

  return now
}
