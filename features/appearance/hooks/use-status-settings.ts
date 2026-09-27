'use client'

import { useEffect, useRef, useState } from 'react'

import {
  DEFAULT_STATUS_COLOR_SETTINGS,
  notifyStatusColorSettingsChanged,
  readStatusColorSettings,
  writeStatusColorSettings,
  type StatusColorSettings,
} from '@/lib/settings/status-settings'

export function useStatusSettings() {
  const [settings, setSettings] = useState<StatusColorSettings>(DEFAULT_STATUS_COLOR_SETTINGS)
  const [draft, setDraft] = useState<StatusColorSettings>(DEFAULT_STATUS_COLOR_SETTINGS)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }
    hasLoadedRef.current = true

    void readStatusColorSettings().then((saved) => {
      setSettings(saved)
      setDraft(saved)
    })
  }, [])

  const updateDraft = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  const confirmColor = async (key: string) => {
    if (draft[key] === settings[key]) {
      return
    }

    const merged = { ...settings, [key]: draft[key] }
    setSettings(merged)
    await writeStatusColorSettings(merged)
    notifyStatusColorSettingsChanged()
  }

  return { settings, draft, updateDraft, confirmColor }
}
