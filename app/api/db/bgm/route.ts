import { NextRequest, NextResponse } from 'next/server'

import { BGMClient } from '@/lib/vndb-client'

const searchSubjects = async (req: NextRequest) => {
  const formData = await req.json()
  const params = req.nextUrl.searchParams
  const offset = params.get('offset') || '0'
  console.log('formData', JSON.stringify(formData))
  const res = await BGMClient.request({
    method: 'POST',
    url: '/v0/search/subjects',
    data: formData,
    params: {
      offset,
    },
  })
  return NextResponse.json(res.data)
}

const getSubjectById = async (req: NextRequest) => {
  const params = req.nextUrl.searchParams
  let id = params.get('id')
  console.log('id', id)
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }
  if (isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid id parameter' }, { status: 400 })
  }

  const res = await BGMClient.request({
    method: 'GET',
    url: `/v0/subjects/${id}`,
  })
  return NextResponse.json(res.data)
}

export const POST = searchSubjects
export const GET = getSubjectById
