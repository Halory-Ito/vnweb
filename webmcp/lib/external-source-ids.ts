export type ExternalSourceBinding = {
  provider: string
  externalId: string
}

/** 解析 externalSourceIds（格式 provider1:id1;provider2:id2） */
export const parseExternalSourceIds = (raw: string): ExternalSourceBinding[] =>
  raw
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const divider = item.indexOf(':')
      if (divider <= 0 || divider >= item.length - 1) {
        return null
      }
      return {
        provider: item.slice(0, divider).trim(),
        externalId: item.slice(divider + 1).trim(),
      }
    })
    .filter((item): item is ExternalSourceBinding => item !== null)

/** 序列化回 externalSourceIds 字符串 */
export const serializeExternalSourceIds = (bindings: ExternalSourceBinding[]): string =>
  bindings.map((item) => `${item.provider}:${item.externalId}`).join(';')

/** 取某个数据源上的绑定（provider 大小写不敏感） */
export const findExternalSourceBinding = (
  bindings: ExternalSourceBinding[],
  provider: string,
): ExternalSourceBinding | undefined =>
  bindings.find(
    (binding) => binding.provider.trim().toLowerCase() === provider.trim().toLowerCase(),
  )

/** 去掉某个数据源上的绑定（provider 大小写不敏感） */
export const withoutExternalSourceBinding = (
  bindings: ExternalSourceBinding[],
  provider: string,
): ExternalSourceBinding[] =>
  bindings.filter(
    (binding) => binding.provider.trim().toLowerCase() !== provider.trim().toLowerCase(),
  )
