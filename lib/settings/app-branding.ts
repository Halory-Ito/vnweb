import { setDesktopWindowTitle } from '@/lib/desktop-window'
import {
  DEFAULT_APP_NAME,
  resolveAppFaviconSrc,
  type AppSettings,
} from '@/lib/settings/app-settings'

declare global {
  interface Window {
    __VNWEB_BASE_TITLE__?: string
    __VNWEB_APPLIED_APP_NAME__?: string
    __VNWEB_INIT_HEAD_OBSERVER__?: MutationObserver
  }
}

let currentAppName = DEFAULT_APP_NAME
let lastBaseTitle = ''
let lastAppliedAppName = DEFAULT_APP_NAME
let lastFormattedTitle = ''
let observerStarted = false

function extractBaseTitle(rawTitle: string): string {
  const defaultSuffix = ` - ${DEFAULT_APP_NAME}`
  if (rawTitle === DEFAULT_APP_NAME) return ''
  if (rawTitle.endsWith(defaultSuffix)) {
    return rawTitle.slice(0, -defaultSuffix.length)
  }

  if (lastAppliedAppName) {
    if (rawTitle === lastAppliedAppName) return ''
    const appliedSuffix = ` - ${lastAppliedAppName}`
    if (rawTitle.endsWith(appliedSuffix)) {
      return rawTitle.slice(0, -appliedSuffix.length)
    }
  }

  return rawTitle
}

function formatAppTitle(baseTitle: string, appName: string): string {
  return baseTitle ? `${baseTitle} - ${appName}` : appName
}

function syncDocumentTitle(appName: string) {
  if (typeof document === 'undefined') return

  if (window.__VNWEB_APPLIED_APP_NAME__ && lastFormattedTitle === '') {
    lastBaseTitle = window.__VNWEB_BASE_TITLE__ ?? ''
    lastAppliedAppName = window.__VNWEB_APPLIED_APP_NAME__
    lastFormattedTitle = document.title
  }

  const rawTitle = document.title
  if (!rawTitle && !lastBaseTitle) return

  const baseTitle =
    rawTitle && rawTitle === lastFormattedTitle ? lastBaseTitle : extractBaseTitle(rawTitle)

  const nextTitle = formatAppTitle(baseTitle, appName)
  lastBaseTitle = baseTitle
  lastAppliedAppName = appName
  lastFormattedTitle = nextTitle
  window.__VNWEB_BASE_TITLE__ = baseTitle
  window.__VNWEB_APPLIED_APP_NAME__ = appName

  if (document.title !== nextTitle) {
    document.title = nextTitle
  }

  void setDesktopWindowTitle(nextTitle)
}

function syncDocumentFavicon(iconPath: string) {
  if (typeof document === 'undefined' || !document.head) return

  const href = resolveAppFaviconSrc(iconPath)
  const isCustom = Boolean(iconPath)
  const existingLinks = document.head.querySelectorAll<HTMLLinkElement>(
    'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]',
  )

  for (const link of existingLinks) {
    if (isCustom) {
      link.removeAttribute('type')
      link.removeAttribute('sizes')
    }
    if (link.getAttribute('href') !== href) {
      link.setAttribute('href', href)
    }
  }

  let managed = document.head.querySelector<HTMLLinkElement>('link[data-vnweb-app-icon="true"]')
  if (!managed) {
    managed = document.createElement('link')
    managed.rel = 'icon'
    managed.setAttribute('data-vnweb-app-icon', 'true')
    managed.href = href
    document.head.appendChild(managed)
  } else if (managed.getAttribute('href') !== href) {
    managed.setAttribute('href', href)
  }
}

export function applyAppBrandingToDocument(settings: AppSettings) {
  if (typeof document === 'undefined') return

  currentAppName = settings.name || DEFAULT_APP_NAME
  syncDocumentTitle(currentAppName)
  syncDocumentFavicon(settings.iconPath)
}

export function startAppTitleObserver(): () => void {
  if (typeof document === 'undefined' || !document.head || observerStarted) {
    return () => {}
  }

  if (window.__VNWEB_INIT_HEAD_OBSERVER__) {
    window.__VNWEB_INIT_HEAD_OBSERVER__.disconnect()
    window.__VNWEB_INIT_HEAD_OBSERVER__ = undefined
  }

  observerStarted = true
  const observer = new MutationObserver(() => {
    if (document.title !== lastFormattedTitle) {
      syncDocumentTitle(currentAppName)
    }
  })

  observer.observe(document.head, {
    childList: true,
    subtree: true,
    characterData: true,
  })

  return () => {
    observer.disconnect()
    observerStarted = false
  }
}
