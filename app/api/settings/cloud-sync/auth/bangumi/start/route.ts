import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin, issueOAuthState } from '../../_shared'
import { BANGUMI_OAUTH_CLIENT_ID } from '@/app/config'

const AUTHORIZE_URL = 'https://bgm.tv/oauth/authorize'

const startBangumiLogin = async (req: NextRequest) => {
  const clientId =
    process.env.BANGUMI_OAUTH_CLIENT_ID || BANGUMI_OAUTH_CLIENT_ID || ''
  if (!clientId) {
    return NextResponse.json(
      { error: '缺少 BANGUMI_OAUTH_CLIENT_ID 配置' },
      { status: 500 },
    )
  }

  const state = await issueOAuthState('bangumi')
  const callbackUrl = new URL(
    '/api/settings/cloud-sync/auth/bangumi/callback',
    getAppOrigin(req),
  )

  const authorizeUrl = new URL(AUTHORIZE_URL)
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString())
  authorizeUrl.searchParams.set('state', state)

  return NextResponse.redirect(authorizeUrl.toString())
}

export { startBangumiLogin as GET }
