import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { getLocalFontDisplayName } from '../font-api'
import {
  applyFontSettingsToDocument,
  BROWSER_FONT_OPTIONS,
  DEFAULT_FONT_SETTINGS,
  getFontConfigApi,
  normalizeFontSettings,
  notifyFontSettingsChanged,
  readFontSettings,
  updateFontConfigApi,
  writeFontSettings,
  type FontSettings,
} from '@/lib/settings/font-settings'

type FontTypography = Pick<FontSettings, 'fontSize' | 'fontWeight'>

const getFontNameFromPath = (fontPath: string) => {
  const browserFontLabel = BROWSER_FONT_OPTIONS.find(
    (option) => option.fontPath === fontPath,
  )?.shortLabel
  if (browserFontLabel) {
    return browserFontLabel
  }

  const normalized = fontPath.replace(/\\/g, '/')
  const fileName = normalized.split('/').pop() || normalized
  const withoutExt = fileName.replace(/\.[^.]+$/, '') || fileName
  return withoutExt.replace(/_\d{10,14}$/, '')
}

export function useFontSettings() {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(DEFAULT_FONT_SETTINGS)
  const [typographyDraft, setTypographyDraft] = useState<Partial<FontTypography>>({})
  const pendingSettingsRef = useRef<FontSettings | null>(null)

  const filename = settings.fontPath.startsWith('/assets/fonts/')
    ? settings.fontPath.slice('/assets/fonts/'.length)
    : ''
  const { data: localizedName } = useQuery({
    queryKey: ['local-font-display-name', filename],
    queryFn: () => getLocalFontDisplayName(filename),
    enabled: Boolean(filename),
    staleTime: Infinity,
  })
  const fontName = localizedName ?? getFontNameFromPath(settings.fontPath)

  const { data: configData } = useQuery({
    queryKey: ['font-config'],
    queryFn: getFontConfigApi,
  })

  const { mutate: saveConfig } = useMutation({
    mutationFn: updateFontConfigApi,
    scope: { id: 'font-config' },
    onSettled: (response, _error, submitted) => {
      if (pendingSettingsRef.current !== submitted) return

      pendingSettingsRef.current = null
      if (response) queryClient.setQueryData(['font-config'], response)
    },
  })

  useEffect(() => {
    const saved = readFontSettings()
    setSettings(saved)
    void applyFontSettingsToDocument(saved)
  }, [])

  useEffect(() => {
    if (pendingSettingsRef.current || !configData?.persisted) {
      return
    }
    const config = normalizeFontSettings(configData.data)
    const localSettings = readFontSettings()
    if (
      config.fontPath !== localSettings.fontPath ||
      config.fontSize !== localSettings.fontSize ||
      config.fontWeight !== localSettings.fontWeight
    ) {
      setSettings(config)
      writeFontSettings(config)
      void applyFontSettingsToDocument(config)
      notifyFontSettingsChanged()
    }
  }, [configData])

  const update = (next: Partial<FontSettings>) => {
    const normalized = normalizeFontSettings({ ...readFontSettings(), ...next })
    pendingSettingsRef.current = normalized
    setSettings(normalized)
    writeFontSettings(normalized)
    notifyFontSettingsChanged()
    saveConfig(normalized)
  }

  const fontSize = typographyDraft.fontSize ?? settings.fontSize
  const fontWeight = typographyDraft.fontWeight ?? settings.fontWeight
  const hasTypographyChanges = fontSize !== settings.fontSize || fontWeight !== settings.fontWeight

  const editTypography = (next: Partial<FontTypography>) => {
    setTypographyDraft((draft) => ({ ...draft, ...next }))
  }

  const selectFont = (fontPath: string) => update({ fontPath })

  const applyTypography = () => {
    if (!hasTypographyChanges) return

    update(typographyDraft)
    setTypographyDraft({})
  }

  return {
    settings,
    fontName,
    selectFont,
    fontSize,
    fontWeight,
    hasTypographyChanges,
    editTypography,
    applyTypography,
  }
}
