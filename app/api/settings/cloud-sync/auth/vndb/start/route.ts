import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin, issueOAuthState } from '../../_shared'
import { readPlatformSettings } from '@/lib/server/platform-settings'

const startVndbLogin = async (req: NextRequest) => {
  const { vndb } = await readPlatformSettings()
  const { oauthClientId: clientId, oauthAuthorizeUrl, oauthScope: scope } = vndb
  if (!clientId) {
    return NextResponse.json({ error: '请在平台配置中填写 VNDB OAuth Client ID' }, { status: 500 })
  }

  const state = await issueOAuthState('vndb')
  const callbackUrl = new URL('/api/settings/cloud-sync/auth/vndb/callback', getAppOrigin(req))

  const authorizeUrl = new URL(oauthAuthorizeUrl)
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString())
  authorizeUrl.searchParams.set('state', state)

  if (scope) {
    authorizeUrl.searchParams.set('scope', scope)
  }

  return NextResponse.redirect(authorizeUrl.toString())
}

export { startVndbLogin as GET }
