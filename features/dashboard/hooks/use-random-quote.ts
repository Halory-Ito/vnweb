'use client'

import { useQuery } from '@tanstack/react-query'
import { useAtom } from 'jotai'

import { getRandomQuoteApi } from '@/api'
import { showNsfwAtom } from '@/atom/global'

export function useRandomQuote() {
  const [showNsfw] = useAtom(showNsfwAtom)

  const query = useQuery({
    queryKey: ['random-quote', showNsfw],
    queryFn: () => getRandomQuoteApi({ includeNsfw: showNsfw }),
  })

  return {
    ...query,
    quote: query.data ?? null,
  }
}
