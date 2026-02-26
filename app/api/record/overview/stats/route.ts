import { NextRequest, NextResponse } from 'next/server'

const getOverviewStats = (_req: NextRequest) => {
  return NextResponse.json({
    data: {
      totalGames: 17,
      totalPlayTime: 120,
      totalDays: 4,
      totalPlayCount: 12,
    },
  })
}

export { getOverviewStats as GET }
