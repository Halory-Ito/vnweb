import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

import { getBoundThirdPartyAccount } from '../../game/third-party-import/_shared'
import { BGMClient } from '@/lib/vndb-client'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0'

const searchSubjects = async (req: NextRequest) => {
  const formData = await req.json()
  const params = req.nextUrl.searchParams
  const offset = params.get('offset') || '0'
  const limit = params.get('limit') || '10'
  const res = await BGMClient.request({
    method: 'POST',
    url: '/v0/search/subjects',
    data: formData,
    params: {
      offset,
      limit,
    },
  })
  return NextResponse.json(res.data)
}

const getSubjectById = async (req: NextRequest) => {
  const params = req.nextUrl.searchParams
  let id = params.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }
  if (isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid id parameter' }, { status: 400 })
  }

  try {
    const res = await BGMClient.request({
      method: 'GET',
      url: `/v0/subjects/${id}`,
    })
    return NextResponse.json(res.data)
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : null
    if (status !== 401 && status !== 403 && status !== 404) {
      throw error
    }

    const account = await getBoundThirdPartyAccount('bangumi')
    if (!account?.accessToken) {
      throw error
    }

    const res = await BGMClient.request({
      method: 'GET',
      url: `/v0/subjects/${id}`,
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        'User-Agent': USER_AGENT,
      },
    })
    return NextResponse.json(res.data)
  }
}

export const POST = searchSubjects
export const GET = getSubjectById
