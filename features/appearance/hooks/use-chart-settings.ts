'use client'

import { useEffect, useState } from 'react'

import {
  CHART_SETTINGS_EVENT,
  DEFAULT_CHART_SETTINGS,
  readChartSettings,
  type ChartSettings,
} from '@/lib/settings/chart-settings'

export function useChartSettings() {
  const [settings, setSettings] = useState<ChartSettings>(DEFAULT_CHART_SETTINGS)

  useEffect(() => {
    readChartSettings().then(setSettings)

    const handleChange = () => {
      readChartSettings().then(setSettings)
    }

    window.addEventListener(CHART_SETTINGS_EVENT, handleChange)
    return () => window.removeEventListener(CHART_SETTINGS_EVENT, handleChange)
  }, [])

  return settings
}
