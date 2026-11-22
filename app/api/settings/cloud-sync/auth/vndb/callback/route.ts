import axios from 'axios'
import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin, saveThirdPartyAccount, validateOAuthState } from '../../_shared'
import { readPlatformSettings } from '@/lib/server/platform-settings'

const toSettingsUrl = (req: NextRequest, status: 'success' | 'failed', reason?: string) => {
  const target = new URL('/settings/sync', req.nextUrl.origin)
  target.searchParams.set('provider', 'vndb')
  target.searchParams.set('status', status)
  if (reason) {
    target.searchParams.set('reason', reason)
  }
  return target.toString()
}

const fetchVndbAccount = async (url: string, accessToken: string) => {
  const tryTokenHeader = async (headerValue: string) => {
    const response = await axios.get(url, {
      timeout: 10_000,
      headers: {
        Authorization: headerValue,
      },
    })

    return response.data as {
      id?: string
      username?: string
    }
  }

  try {
    return await tryTokenHeader(`Bearer ${accessToken}`)
  } catch {
    return tryTokenHeader(`Token ${accessToken}`)
  }
}

const vndbCallback = async (req: NextRequest) => {
  try {
    const code = req.nextUrl.searchParams.get('code') || ''
    const state = req.nextUrl.searchParams.get('state') || ''

    if (!code) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed', 'missing_code'))
    }

    const stateOk = await validateOAuthState('vndb', state)
    if (!stateOk) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed', 'invalid_state'))
    }

    const { vndb } = await readPlatformSettings()
    const {
      oauthClientId: clientId,
      oauthClientSecret: clientSecret,
      oauthTokenUrl,
      oauthUserInfoUrl,
    } = vndb
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed', 'missing_config'))
    }

    const callbackUrl = new URL('/api/settings/cloud-sync/auth/vndb/callback', getAppOrigin(req))

    const tokenResponse = await axios.post(
      oauthTokenUrl,
      {
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl.toString(),
      },
      {
        timeout: 10_000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    )

    const tokenPayload = tokenResponse.data as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }

    const accessToken = (tokenPayload.access_token || '').trim()
    const refreshToken = (tokenPayload.refresh_token || '').trim()

    if (!accessToken) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed', 'missing_token'))
    }

    const profile = await fetchVndbAccount(oauthUserInfoUrl, accessToken)
    const accountId = profile.id?.trim() || profile.username?.trim() || ''

    if (!accountId) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed', 'missing_account_id'))
    }

    const expiresAt = tokenPayload.expires_in
      ? dayjs().add(tokenPayload.expires_in, 'second').toISOString()
      : ''

    await saveThirdPartyAccount('vndb', accountId, accessToken, refreshToken, expiresAt)

    return NextResponse.redirect(toSettingsUrl(req, 'success'))
  } catch {
    return NextResponse.redirect(toSettingsUrl(req, 'failed', 'callback_error'))
  }
}

export { vndbCallback as GET }
