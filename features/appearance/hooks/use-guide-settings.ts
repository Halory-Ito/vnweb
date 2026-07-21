import { useEffect, useRef, useState } from 'react'

import {
  DEFAULT_GUIDE_SETTINGS,
  type GuideColorSettings,
  readGuideSettings,
  writeGuideSettings,
  notifyGuideSettingsChanged,
} from '@/lib/settings/guide-settings'

export function useGuideSettings() {
  const [settings, setSettings] = useState<GuideColorSettings>(DEFAULT_GUIDE_SETTINGS)
  const [draft, setDraft] = useState<GuideColorSettings>(DEFAULT_GUIDE_SETTINGS)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }
    hasLoadedRef.current = true

    readGuideSettings().then((saved) => {
      setSettings(saved)
      setDraft(saved)
    })
  }, [])

  const updateDraft = (key: keyof GuideColorSettings, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const confirmColor = async (key: keyof GuideColorSettings) => {
    if (draft[key] !== settings[key]) {
      const merged = { ...settings, [key]: draft[key] }
      setSettings(merged)
      await writeGuideSettings(merged)
      notifyGuideSettingsChanged()
    }
  }

  return { settings, draft, updateDraft, confirmColor }
}
