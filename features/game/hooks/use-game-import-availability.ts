'use client'

import { useSyncExternalStore } from 'react'

import { PLUGIN_SETTINGS_EVENT, isPluginEnabled, readPluginSettings } from '@/lib/plugins'

const IMPORT_PROVIDERS = ['steam', 'bangumi', 'vndb', 'ymgal'] as const

function subscribe(onChange: () => void) {
  window.addEventListener(PLUGIN_SETTINGS_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(PLUGIN_SETTINGS_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

function getSnapshot() {
  const settings = readPluginSettings()
  return IMPORT_PROVIDERS.map((id) => (isPluginEnabled(id, settings) ? '1' : '0')).join('')
}

export function useGameImportAvailability() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => '1111')

  return {
    steamEnabled: snapshot[0] === '1',
    bangumiEnabled: snapshot[1] === '1',
    vndbEnabled: snapshot[2] === '1',
    ymgalEnabled: snapshot[3] === '1',
    hasBulkImport: snapshot.includes('1'),
  }
}
