import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

import { getChineseFontDisplayName } from '@/lib/server/font-display-name'

export async function GET(request: NextRequest) {
  const filename = request.nextUrl.searchParams.get('file') ?? ''
  if (!/^[^/\\:\p{Cc}]+\.(?:ttf|otf|ttc|woff|woff2)$/iu.test(filename)) {
    return NextResponse.json({ data: { name: null } }, { status: 400 })
  }

  try {
    const directory = await fs.realpath(path.join(process.cwd(), 'assets', 'fonts'))
    const file = await fs.realpath(path.join(directory, filename))
    if (path.relative(directory, file) !== filename || !(await fs.stat(file)).isFile()) {
      return NextResponse.json({ data: { name: null } })
    }
    const name = getChineseFontDisplayName(await fs.readFile(file))
    return NextResponse.json({ data: { name: name ?? null } })
  } catch {
    return NextResponse.json({ data: { name: null } })
  }
}
