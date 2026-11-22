import dayjs from 'dayjs'

import { parseMetingRef } from '../meting-types'
import { getMetingDetails, getOstAlbumDetails } from '../ost-api'

import type { UnifiedAlbumDetails } from '../types'

export type OstService = 'enhanced-api' | 'meting-api'

export function toDisplayDate(date: string | null | undefined): string {
  if (!date) return '-'
  const d = dayjs(date)
  return d.isValid() ? d.format('YYYY-MM-DD') : '-'
}

export async function getAlbumDetails(
  service: OstService,
  ref: string | number,
): Promise<UnifiedAlbumDetails> {
  const input = parseMetingRef(String(ref))
  if (input.type !== 'album') throw new Error('仅支持导入专辑，请选择专辑引用')
  if (service === 'enhanced-api') {
    return getOstAlbumDetails(input.id)
  }
  return getMetingDetails(input)
}
