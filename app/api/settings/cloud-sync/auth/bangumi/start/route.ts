import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin, issueOAuthState } from '../../_shared'
import { readPlatformSettings, resolveBangumiEndpoints } from '@/lib/server/platform-settings'

const startBangumiLogin = async (req: NextRequest) => {
  const { bangumi } = await readPlatformSettings()
  const clientId = bangumi.oauthClientId
  if (!clientId) {
    return NextResponse.json({ error: '缺少 BANGUMI_OAUTH_CLIENT_ID 配置' }, { status: 500 })
  }

  const { baseUrl } = resolveBangumiEndpoints(bangumi)
  const state = await issueOAuthState('bangumi')
  const callbackUrl = new URL('/api/settings/cloud-sync/auth/bangumi/callback', getAppOrigin(req))

  const authorizeUrl = new URL(`${baseUrl}/oauth/authorize`)
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString())
  authorizeUrl.searchParams.set('state', state)

  return NextResponse.redirect(authorizeUrl.toString())
}

export { startBangumiLogin as GET }
