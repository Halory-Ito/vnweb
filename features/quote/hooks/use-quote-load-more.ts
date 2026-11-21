import { useEffect, useRef } from 'react'

export function useQuoteLoadMore(enabled: boolean, onLoadMore: () => unknown) {
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const target = sentinel.current
    if (!enabled || !target || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return

      observer.disconnect()
      void onLoadMore()
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [enabled, onLoadMore])

  return sentinel
}
