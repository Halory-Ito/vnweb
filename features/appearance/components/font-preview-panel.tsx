'use client'

import { useEffect, useState } from 'react'

import { getBrowserFontFamily } from '@/lib/settings/font-settings'

const PREVIEW_FONT_FAMILY = 'VNWebPreviewFont'

const PREVIEW_LINES = [
  { text: '天地玄黄，宇宙洪荒。', className: 'text-2xl' },
  { text: 'The quick brown fox jumps over the lazy dog.', className: 'text-base' },
  { text: '0123456789', className: 'text-sm' },
]

type FontPreviewPanelProps = {
  fontPath: string
  fontWeight: number
}

export function FontPreviewPanel({ fontPath, fontWeight }: FontPreviewPanelProps) {
  const [loadedPath, setLoadedPath] = useState('')
  const browserFamily = getBrowserFontFamily(fontPath)

  useEffect(() => {
    if (!fontPath || browserFamily) return

    let cancelled = false
    const loadPreview = async () => {
      try {
        const safePath = fontPath.replace(/"/g, '')
        const fontFace = new FontFace(PREVIEW_FONT_FAMILY, `url("${safePath}")`)
        const loaded = await fontFace.load()

        if (cancelled || typeof document === 'undefined') return

        for (const face of Array.from(document.fonts)) {
          if (face.family.replace(/['"]/g, '') === PREVIEW_FONT_FAMILY) {
            document.fonts.delete(face)
          }
        }
        document.fonts.add(loaded)
        setLoadedPath(fontPath)
      } catch {
        if (!cancelled) setLoadedPath('')
      }
    }

    void loadPreview()
    return () => {
      cancelled = true
    }
  }, [fontPath, browserFamily])

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="bg-muted/40 flex min-h-[322px] flex-1 flex-col justify-center gap-4 rounded-lg px-6 py-8">
        {PREVIEW_LINES.map((line) => (
          <p
            key={line.text}
            className={`${line.className} leading-relaxed`}
            style={{
              fontFamily:
                browserFamily ??
                (fontPath && loadedPath === fontPath
                  ? `'${PREVIEW_FONT_FAMILY}', sans-serif`
                  : undefined),
              fontWeight,
            }}
          >
            {line.text}
          </p>
        ))}
      </div>
    </div>
  )
}
