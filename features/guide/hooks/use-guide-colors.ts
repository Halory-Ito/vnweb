'use client'

import { useEffect, useState } from 'react'

import {
  DEFAULT_GUIDE_SETTINGS,
  GUIDE_SETTINGS_EVENT,
  type GuideColorSettings,
  readGuideSettings,
} from '@/lib/settings/guide-settings'

export function useGuideColors() {
  const [colors, setColors] = useState<GuideColorSettings>(DEFAULT_GUIDE_SETTINGS)

  useEffect(() => {
    readGuideSettings().then(setColors)

    const handler = () => {
      readGuideSettings().then(setColors)
    }

    window.addEventListener(GUIDE_SETTINGS_EVENT, handler)
    return () => window.removeEventListener(GUIDE_SETTINGS_EVENT, handler)
  }, [])

  return colors
}
