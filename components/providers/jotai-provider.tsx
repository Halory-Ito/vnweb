'use client'

import { Provider } from 'jotai'
import { createStore } from 'jotai/vanilla'
import { useRef } from 'react'

type JotaiProviderProps = {
  children: React.ReactNode
}

export default function JotaiProvider({ children }: JotaiProviderProps) {
  const storeRef = useRef<ReturnType<typeof createStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createStore()
  }

  return <Provider store={storeRef.current}>{children}</Provider>
}
