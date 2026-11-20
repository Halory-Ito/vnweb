export type LyricTrackKey = 'original' | 'translation' | 'romaji'

export type LrcCue = {
  time: number
  original: string
  translation?: string
  romaji?: string
}

export type ParsedLyrics = {
  cues: LrcCue[]
  hasTranslation: boolean
  hasRomaji: boolean
}

const TIMESTAMP_RE = /\[(\d+):(\d{2})(?:[.:](\d{1,3}))?\]/g
const ROMAJI_RE = /^[\p{Script=Latin}\d\s.,!?;:'"()\-–—~…♪♫/]+$/u
const CJK_OR_KANA_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const KANA_OR_HANGUL_RE = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u
const HAN_RE = /\p{Script=Han}/u
const INLINE_SPLIT_RE = /\s+[/／|｜]\s+/
const BRACKET_TRANS_RE = /^(.+?)\s*(?:\(|（|【)([^()（）【】]{2,})(?:\)|）|】)$/

function isLikelyRomaji(text: string, original: string): boolean {
  return ROMAJI_RE.test(text) && CJK_OR_KANA_RE.test(original)
}

function isLikelyChineseTranslation(text: string, original: string): boolean {
  return HAN_RE.test(text) && !KANA_OR_HANGUL_RE.test(text) && (KANA_OR_HANGUL_RE.test(original) || ROMAJI_RE.test(original))
}

/** 尝试将单行双语/三语歌词（如 "原文 / 翻译"、"原文 / 音译 / 翻译"、"原文（翻译）"）拆分 */
function splitInlineTracks(text: string): string[] {
  const parts = text
    .split(INLINE_SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length >= 2 && parts.length <= 3) {
    const [first, ...rest] = parts
    const hasCrossScript = rest.some(
      (part) => isLikelyRomaji(part, first) || isLikelyChineseTranslation(part, first),
    )
    if (hasCrossScript) return parts
  }

  const bracketMatch = text.match(BRACKET_TRANS_RE)
  if (bracketMatch) {
    const [, main, sub] = bracketMatch
    if (isLikelyChineseTranslation(sub.trim(), main.trim())) {
      return [main.trim(), sub.trim()]
    }
  }

  return [text]
}

export function parseLrc(text: string): ParsedLyrics {
  const raw = text
    .split(/\r?\n/)
    .flatMap((line, order) => {
      const tags = [...line.matchAll(TIMESTAMP_RE)]
      const lyric = line.replace(/\[[^\]]*\]/g, '').trim()
      if (!lyric) return []
      const segments = splitInlineTracks(lyric)
      return tags.flatMap(([, minutes, seconds, fraction = '']) => {
        const time =
          Number(minutes) * 60 + Number(seconds) + Number(fraction.padEnd(3, '0')) / 1000
        return segments.map((segment, segIndex) => ({
          time,
          text: segment,
          order: order * 10 + segIndex,
        }))
      })
    })
    .sort((a, b) => a.time - b.time || a.order - b.order)

  const cues: LrcCue[] = []
  let hasTranslation = false
  let hasRomaji = false

  for (const item of raw) {
    const prev = cues[cues.length - 1]
    const timeDiff = prev ? Math.abs(item.time - prev.time) : Infinity
    const canMergeSameTime =
      Boolean(prev) &&
      (timeDiff <= 0.05 ||
        (timeDiff <= 0.25 &&
          (isLikelyRomaji(item.text, prev.original) ||
            isLikelyChineseTranslation(item.text, prev.original))))

    if (!prev || !canMergeSameTime) {
      cues.push({ time: item.time, original: item.text })
      continue
    }

    if (!prev.romaji && isLikelyRomaji(item.text, prev.original)) {
      prev.romaji = item.text
      hasRomaji = true
    } else if (!prev.translation) {
      prev.translation = item.text
      hasTranslation = true
    } else if (!prev.romaji) {
      prev.romaji = item.text
      hasRomaji = true
    }
  }

  return { cues, hasTranslation, hasRomaji }
}

/** 二分查找当前时间对应的歌词索引，O(log N) */
export function findActiveCueIndex(cues: LrcCue[], time: number): number {
  let low = 0
  let high = cues.length - 1
  let result = -1
  while (low <= high) {
    const mid = (low + high) >>> 1
    if (cues[mid].time <= time) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return result
}
