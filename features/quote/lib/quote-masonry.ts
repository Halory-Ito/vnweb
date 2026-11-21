import type { QuoteManageItem } from '@/types'

function estimateTextLines(text: string, charsPerLine: number): number {
  let lines = 0
  for (const segment of text.split('\n')) {
    lines += Math.max(1, Math.ceil(segment.length / charsPerLine))
  }
  return lines
}

/**
 * 估算摘录便利贴卡片的视觉高度权重，用于稳定分列。
 */
export function estimateQuoteCardWeight(item: QuoteManageItem): number {
  let weight = 130 + estimateTextLines(item.content, 20) * 24

  if (item.context) {
    weight += 28 + estimateTextLines(item.context, 24) * 20
  }

  return weight
}

/**
 * 按当前累计权重最小列依次分配卡片，保证无限滚动追加时已有卡片不跨列跳动。
 */
export function distributeQuoteColumns(
  items: QuoteManageItem[],
  columnCount: number,
): QuoteManageItem[][] {
  const safeColumnCount = Math.max(1, Math.floor(columnCount))
  if (safeColumnCount === 1) {
    return [items]
  }

  const columns: QuoteManageItem[][] = Array.from({ length: safeColumnCount }, () => [])
  const weights = Array.from({ length: safeColumnCount }, () => 0)

  for (const item of items) {
    let targetIndex = 0
    for (let i = 1; i < safeColumnCount; i++) {
      if (weights[i] < weights[targetIndex]) {
        targetIndex = i
      }
    }

    columns[targetIndex].push(item)
    weights[targetIndex] += estimateQuoteCardWeight(item)
  }

  return columns
}
