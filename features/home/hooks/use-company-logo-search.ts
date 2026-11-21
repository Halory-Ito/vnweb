import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { searchCompanyLogos } from '../company-logo-api'

export function useCompanyLogoSearch(title: string) {
  const [keyword, setKeyword] = useState(title.slice(0, 100))
  const [submitted, setSubmitted] = useState('')
  const result = useQuery({
    queryKey: ['company-logos', submitted],
    queryFn: ({ signal }) => searchCompanyLogos(submitted, signal),
    enabled: Boolean(submitted),
    retry: false,
    staleTime: 300_000,
  })

  function search() {
    const query = keyword.trim()
    if (!query) return
    if (query === submitted) {
      void result.refetch()
    } else {
      setSubmitted(query)
    }
  }

  return { keyword, setKeyword, submitted, result, search }
}
