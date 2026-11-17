import dayjs from 'dayjs'

import { parseMetingRef } from '../meting-types'
import { getMetingDetails, getOstAlbumDetails, searchOstAlbums } from '../ost-api'

import type { MusicSource, UnifiedAlbumDetails, UnifiedSearchResult } from '../types'

export function toDisplayDate(date: string | null | undefined): string {
  if (!date) return '-'
  const d = dayjs(date)
  return d.isValid() ? d.format('YYYY-MM-DD') : '-'
}
export async function searchAlbums(
  kw: string,
  _source: MusicSource = 'meting-api',
): Promise<UnifiedSearchResult[]> {
  return searchOstAlbums(kw)
}
export async function getAlbumDetails(
  _source: MusicSource,
  ref: string | number,
): Promise<UnifiedAlbumDetails> {
  const input = parseMetingRef(String(ref))
  if (input.type !== 'album') throw new Error('OST 只能导入专辑，请选择专辑引用')
  return input.server === 'netease' ? getOstAlbumDetails(input.id) : getMetingDetails(input)
}
