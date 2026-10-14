export type GameNameSource = {
  name: string
  nameCn: string
}

export type SearchWithKeywordsResult<T> = {
  results: T[]
  /** 实际命中的关键词（全部未命中时为第一个候选） */
  keyword: string
  /** 依次尝试过的关键词 */
  triedKeywords: string[]
}

/** 最多尝试几个候选名称，避免逐个名称都去请求外部接口 */
export const MAX_NAME_ATTEMPTS = 2

/**
 * 去重出候选搜索名称：
 * preferChinese 时中文名优先（中文平台 / Steam 商店用 schinese 搜索），否则原名优先。
 * 传入 explicit 时只返回它（显式指定的搜索词不再做名称回退）。
 */
export const buildGameNameCandidates = (
  target: GameNameSource,
  options?: { preferChinese?: boolean; explicit?: string },
): string[] => {
  const explicit = (options?.explicit ?? '').trim()
  if (explicit) {
    return [explicit]
  }

  const preferred = options?.preferChinese
    ? [target.nameCn, target.name]
    : [target.name, target.nameCn]

  return [...new Set(preferred.map((value) => (value ?? '').trim()).filter(Boolean))]
}

/**
 * 按候选关键词依次搜索，命中（结果非空）即停。
 * 用于「库内名称搜不到就换另一个名称再试」这类回退逻辑。
 */
export const searchWithGameNameCandidates = async <T>(
  candidates: string[],
  search: (keyword: string) => Promise<T[]>,
): Promise<SearchWithKeywordsResult<T>> => {
  const triedKeywords: string[] = []
  let keyword = candidates[0] ?? ''
  let results: T[] = []

  for (const candidate of candidates.slice(0, MAX_NAME_ATTEMPTS)) {
    triedKeywords.push(candidate)
    results = await search(candidate)
    if (results.length > 0) {
      keyword = candidate
      break
    }
  }

  return { results, keyword, triedKeywords }
}
