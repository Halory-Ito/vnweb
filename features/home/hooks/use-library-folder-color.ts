import { useAtom } from 'jotai'
import { useCallback, useEffect, useRef, useState } from 'react'

import { folderColorsAtom, isFolderColor } from '@/lib/settings/game-library-folder-colors'

const SAVE_DELAY_MS = 300

export function useLibraryFolderColor(href: string) {
  const [colors, setColors] = useAtom(folderColorsAtom)
  const [open, setDialogOpen] = useState(false)
  const [previewColor, setPreviewColor] = useState<string>()
  const pendingColor = useRef<string>(undefined)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const commitColor = useCallback(() => {
    clearTimeout(timer.current)
    const value = pendingColor.current
    pendingColor.current = undefined
    if (value) setColors((current) => ({ ...current, [href]: value }))
  }, [href, setColors])

  useEffect(() => {
    window.addEventListener('pagehide', commitColor)
    return () => {
      window.removeEventListener('pagehide', commitColor)
      commitColor()
    }
  }, [commitColor])

  function flushPreview() {
    commitColor()
    setPreviewColor(undefined)
  }

  function setOpen(nextOpen: boolean) {
    if (!nextOpen) flushPreview()
    setDialogOpen(nextOpen)
  }

  function setColor(value: string) {
    if (!isFolderColor(value)) return
    setPreviewColor(value)
    pendingColor.current = value
    clearTimeout(timer.current)
    timer.current = setTimeout(flushPreview, SAVE_DELAY_MS)
  }

  function resetColor() {
    clearTimeout(timer.current)
    pendingColor.current = undefined
    setPreviewColor(undefined)
    setColors((current) => {
      const next = { ...current }
      delete next[href]
      return next
    })
  }

  return { color: previewColor ?? colors[href], open, setOpen, setColor, resetColor }
}
