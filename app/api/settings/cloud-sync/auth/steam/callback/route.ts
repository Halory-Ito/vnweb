import axios from 'axios'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

import { ThirdPartyAccountTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login'
const STEAM_CLAIMED_PREFIXES = [
  'https://steamcommunity.com/openid/id/',
  'http://steamcommunity.com/openid/id/',
]

const getOpenIdParams = (req: NextRequest) => {
  const params = new URLSearchParams()
  req.nextUrl.searchParams.forEach((value, key) => {
    if (key.startsWith('openid.')) {
      params.set(key, value)
    }
  })
  return params
}

const parseSteamId = (claimedId: string) => {
  for (const prefix of STEAM_CLAIMED_PREFIXES) {
    if (!claimedId.startsWith(prefix)) {
      continue
    }

    const steamId = claimedId.slice(prefix.length).trim()
    return /^\d{17}$/.test(steamId) ? steamId : ''
  }

  return ''
}

const toSettingsUrl = (req: NextRequest, status: 'success' | 'failed') => {
  const target = new URL('/settings', req.nextUrl.origin)
  target.searchParams.set('provider', 'steam')
  target.searchParams.set('status', status)
  return target.toString()
}

const steamCallback = async (req: NextRequest) => {
  try {
    const incoming = getOpenIdParams(req)
    const claimedId = incoming.get('openid.claimed_id') || ''

    if (!claimedId) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    incoming.set('openid.mode', 'check_authentication')

    const verification = await axios.post(
      STEAM_OPENID_ENDPOINT,
      incoming.toString(),
      {
        timeout: 10_000,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )

    const bodyText = String(verification.data || '')
    if (!/is_valid\s*:\s*true/i.test(bodyText)) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    const steamId = parseSteamId(claimedId)
    if (!steamId) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    const now = dayjs().toISOString()

    await db.transaction(async (tx) => {
      await tx
        .delete(ThirdPartyAccountTable)
        .where(eq(ThirdPartyAccountTable.provider, 'steam'))

      await tx.insert(ThirdPartyAccountTable).values({
        provider: 'steam',
        accountId: steamId,
        accessToken: 'steam_openid',
        refreshToken: '',
        expiresAt: '',
        createdAt: now,
        updatedAt: now,
      })
    })

    return NextResponse.redirect(toSettingsUrl(req, 'success'))
  } catch (error) {
    console.error('Steam login callback failed:', error)
    return NextResponse.redirect(toSettingsUrl(req, 'failed'))
  }
}

export { steamCallback as GET }
