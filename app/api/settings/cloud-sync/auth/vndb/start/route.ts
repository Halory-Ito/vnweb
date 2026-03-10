import { NextRequest, NextResponse } from 'next/server'

import { getAppOrigin, issueOAuthState } from '../../_shared'

const getAuthorizeUrl = () => {
  return (
    process.env.VNDB_OAUTH_AUTHORIZE_URL || 'https://vndb.org/oauth/authorize'
  )
}

const startVndbLogin = async (req: NextRequest) => {
  const clientId = process.env.VNDB_OAUTH_CLIENT_ID || ''
  if (!clientId) {
    return NextResponse.json(
      { error: '缺少 VNDB_OAUTH_CLIENT_ID 配置' },
      { status: 500 },
    )
  }

  const state = await issueOAuthState('vndb')
  const callbackUrl = new URL(
    '/api/settings/cloud-sync/auth/vndb/callback',
    getAppOrigin(req),
  )

  const authorizeUrl = new URL(getAuthorizeUrl())
  authorizeUrl.searchParams.set('client_id', clientId)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl.toString())
  authorizeUrl.searchParams.set('state', state)

  const scope = (process.env.VNDB_OAUTH_SCOPE || '').trim()
  if (scope) {
    authorizeUrl.searchParams.set('scope', scope)
  }

  return NextResponse.redirect(authorizeUrl.toString())
}

export { startVndbLogin as GET }
