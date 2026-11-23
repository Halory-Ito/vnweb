import { NextRequest, NextResponse } from 'next/server'

import { issueOAuthState } from '../../_shared'

const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login'

const buildReturnTo = (req: NextRequest, state: string) => {
  const callbackUrl = new URL('/api/settings/cloud-sync/auth/steam/callback', req.nextUrl.origin)
  callbackUrl.searchParams.set('state', state)
  return callbackUrl.toString()
}

const startSteamLogin = async (req: NextRequest) => {
  const realm = req.nextUrl.origin
  const returnTo = buildReturnTo(req, await issueOAuthState('steam'))

  const params = new URLSearchParams({
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
  })

  const redirectUrl = `${STEAM_OPENID_ENDPOINT}?${params.toString()}`
  return NextResponse.redirect(redirectUrl)
}

export { startSteamLogin as GET }
