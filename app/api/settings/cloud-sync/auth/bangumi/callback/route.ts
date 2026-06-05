import axios from 'axios'
import dayjs from 'dayjs'
import { NextRequest, NextResponse } from 'next/server'

import {
  getAppOrigin,
  saveThirdPartyAccount,
  validateOAuthState,
} from '../../_shared'
import {
  NEXT_PUBLIC_BANGUMI_API_URL,
  NEXT_PUBLIC_BANGUMI_BASE_URL,
} from '@/app/config'
import {
  BANGUMI_OAUTH_CLIENT_ID,
  BANGUMI_OAUTH_CLIENT_SECRET,
} from '@/app/config'

const TOKEN_URL = `${NEXT_PUBLIC_BANGUMI_BASE_URL}/oauth/access_token`
const PROFILE_URL = `${NEXT_PUBLIC_BANGUMI_API_URL}/v0/me`

const toSettingsUrl = (
  req: NextRequest,
  status: 'success' | 'failed',
  reason?: string,
) => {
  const target = new URL('/settings', req.nextUrl.origin)
  target.searchParams.set('provider', 'bangumi')
  target.searchParams.set('status', status)
  if (reason) {
    target.searchParams.set('reason', reason)
  }
  return target.toString()
}

const bangumiCallback = async (req: NextRequest) => {
  try {
    const code = req.nextUrl.searchParams.get('code') || ''
    const state = req.nextUrl.searchParams.get('state') || ''

    if (!code) {
      return NextResponse.redirect(toSettingsUrl(req, 'failed', 'missing_code'))
    }

    const stateOk = await validateOAuthState('bangumi', state)
    if (!stateOk) {
      return NextResponse.redirect(
        toSettingsUrl(req, 'failed', 'invalid_state'),
      )
    }

    const clientId =
      process.env.BANGUMI_OAUTH_CLIENT_ID || BANGUMI_OAUTH_CLIENT_ID || ''
    const clientSecret =
      process.env.BANGUMI_OAUTH_CLIENT_SECRET ||
      BANGUMI_OAUTH_CLIENT_SECRET ||
      ''
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        toSettingsUrl(req, 'failed', 'missing_config'),
      )
    }

    const callbackUrl = new URL(
      '/api/settings/cloud-sync/auth/bangumi/callback',
      getAppOrigin(req),
    )

    const tokenResponse = await axios.post(
      TOKEN_URL,
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
      return NextResponse.redirect(
        toSettingsUrl(req, 'failed', 'missing_token'),
      )
    }

    const profileResponse = await axios.get(PROFILE_URL, {
      timeout: 10_000,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'vnweb/1.0',
      },
    })

    const profile = profileResponse.data as {
      id?: number
      username?: string
      nickname?: string
    }

    const accountId =
      profile.username?.trim() ||
      profile.nickname?.trim() ||
      (profile.id ? String(profile.id) : '')

    if (!accountId) {
      return NextResponse.redirect(
        toSettingsUrl(req, 'failed', 'missing_account_id'),
      )
    }

    const expiresAt = tokenPayload.expires_in
      ? dayjs().add(tokenPayload.expires_in, 'second').toISOString()
      : ''

    await saveThirdPartyAccount(
      'bangumi',
      accountId,
      accessToken,
      refreshToken,
      expiresAt,
    )

    return NextResponse.redirect(toSettingsUrl(req, 'success'))
  } catch (error) {
    console.error('Bangumi oauth callback failed:', error)
    return NextResponse.redirect(toSettingsUrl(req, 'failed', 'callback_error'))
  }
}

export { bangumiCallback as GET }
