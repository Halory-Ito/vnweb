'use client'

import { useMemo, useSyncExternalStore } from 'react'

import {
  EMPTY_STATE_EVENT,
  EMPTY_STATE_KEY,
  parseEmptyStateSettings,
  readEmptyStateSnapshot,
} from '@/lib/settings/empty-state-settings'

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === EMPTY_STATE_KEY || event.key === null) onChange()
  }
  window.addEventListener(EMPTY_STATE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(EMPTY_STATE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function useEmptyStateSettings() {
  const snapshot = useSyncExternalStore(subscribe, readEmptyStateSnapshot, () => null)
  return useMemo(() => parseEmptyStateSettings(snapshot), [snapshot])
}
