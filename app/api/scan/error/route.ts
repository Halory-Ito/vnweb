import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { ScanErrorTable } from '@/db/schema'
import { db } from '@/lib/drizzle'

const getScanErrors = async () => {
  try {
    const rows = await db
      .select({
        id: ScanErrorTable.id,
        directory: ScanErrorTable.directory,
        error: ScanErrorTable.error,
        status: ScanErrorTable.status,
        createdAt: ScanErrorTable.createdAt,
        updatedAt: ScanErrorTable.updatedAt,
      })
      .from(ScanErrorTable)
      .orderBy(desc(ScanErrorTable.id))

    return NextResponse.json({ data: rows })
  } catch (error) {
    console.error('Get scan errors failed:', error)
    return NextResponse.json(
      { error: 'Failed to get scan errors' },
      { status: 500 },
    )
  }
}

export { getScanErrors as GET }
