'use client'

import { useEffect, useState } from 'react'

import { getBrowserFontFamily } from '@/lib/settings/font-settings'

const PREVIEW_FONT_FAMILY = 'VNWebPreviewFont'

const PREVIEW_LINES = [
  { text: '天地玄黄，宇宙洪荒。', className: 'text-2xl' },
  { text: 'The quick brown fox jumps over the lazy dog.', className: 'text-base' },
  { text: '0123456789 · vnweb 字体预览', className: 'text-sm' },
]

type FontPreviewPanelProps = {
  fontPath: string
  fontWeight: number
  label: string
}

export function FontPreviewPanel({ fontPath, fontWeight, label }: FontPreviewPanelProps) {
  const [isReady, setIsReady] = useState(false)
  const browserFamily = getBrowserFontFamily(fontPath)

  useEffect(() => {
    if (!fontPath) {
      setIsReady(false)
      return
    }

    if (browserFamily) {
      setIsReady(true)
      return
    }

    let cancelled = false
    const loadPreview = async () => {
      try {
        setIsReady(false)
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
        setIsReady(true)
      } catch {
        if (!cancelled) setIsReady(false)
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
              fontFamily: browserFamily ?? `'${PREVIEW_FONT_FAMILY}', sans-serif`,
              fontWeight,
            }}
          >
            {line.text}
          </p>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground truncate">
          {isReady ? label : '正在加载字体...'}
        </span>
        <span className="text-muted-foreground/70 shrink-0 font-mono">
          {browserFamily ?? (isReady ? 'local file' : '')}
        </span>
      </div>
    </div>
  )
}
