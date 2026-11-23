import axios from 'axios'
import { NextResponse } from 'next/server'

import { getBoundThirdPartyAccount } from '@/app/api/game/third-party-import/_shared'

export async function GET() {
  const account = await getBoundThirdPartyAccount('vndb')
  if (!account?.accessToken) return NextResponse.json({ status: 'unbound' })

  try {
    const { data } = await axios.get<{ id?: string; permissions?: unknown }>(
      'https://api.vndb.org/kana/authinfo',
      {
        headers: { Authorization: `Token ${account.accessToken}`, 'User-Agent': 'vnweb/1.0' },
        timeout: 10000,
        maxRedirects: 0,
      },
    )
    if (data?.id !== account.accountId) return NextResponse.json({ status: 'invalid' })
    if (!Array.isArray(data.permissions))
      return NextResponse.json({ status: 'unavailable' }, { status: 502 })
    return NextResponse.json({
      status: data.permissions.includes('listwrite') ? 'writable' : 'read-only',
    })
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    if (status === 401 || status === 403) return NextResponse.json({ status: 'invalid' })
    return NextResponse.json({ status: 'unavailable' }, { status: 502 })
  }
}
