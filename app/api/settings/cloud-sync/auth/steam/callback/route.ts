import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

import { saveThirdPartyAccount, validateOAuthState } from '../../_shared'

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
  const target = new URL('/settings/sync', req.nextUrl.origin)
  target.searchParams.set('provider', 'steam')
  target.searchParams.set('status', status)
  return target.toString()
}

const steamCallback = async (req: NextRequest) => {
  try {
    const state = req.nextUrl.searchParams.get('state') ?? ''
    if (!(await validateOAuthState('steam', state))) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    const expectedReturnTo = new URL(req.nextUrl.pathname, req.nextUrl.origin)
    expectedReturnTo.searchParams.set('state', state)
    const incoming = getOpenIdParams(req)
    const claimedId = incoming.get('openid.claimed_id') || ''

    const signedFields = incoming.get('openid.signed')?.split(',') ?? []
    if (
      !claimedId ||
      incoming.get('openid.mode') !== 'id_res' ||
      incoming.get('openid.return_to') !== expectedReturnTo.href ||
      !signedFields.includes('return_to') ||
      !signedFields.includes('claimed_id')
    ) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    incoming.set('openid.mode', 'check_authentication')

    const verification = await axios.post(STEAM_OPENID_ENDPOINT, incoming.toString(), {
      timeout: 10_000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const bodyText = String(verification.data || '')
    if (!/^is_valid:true\r?$/m.test(bodyText)) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    const steamId = parseSteamId(claimedId)
    if (!steamId) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed'))
    }

    await saveThirdPartyAccount('steam', steamId, 'steam_openid', '', '')

    return NextResponse.redirect(toSettingsUrl(req, 'success'))
  } catch (error) {
    console.error('Steam login callback failed:', error)
    return NextResponse.redirect(toSettingsUrl(req, 'failed'))
  }
}

export { steamCallback as GET }
