'use client'

import { useEffect } from 'react'

export default function WebsiteTitleUpdater() {
  useEffect(() => {
    // 更新 favicon
    const existingIcon = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null

    if (existingIcon) {
      existingIcon.href = '/icon.svg'
    } else {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.href = '/icon.svg'
      document.head.appendChild(link)
    }
  }, [])

  return null
}
