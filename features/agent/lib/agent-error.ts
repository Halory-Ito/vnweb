import axios from 'axios'

/** 提取 Agent 接口的错误信息：优先取响应体中的 error 字段 */
export function getAgentErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: unknown } | undefined
    if (data && typeof data.error === 'string' && data.error) {
      return data.error
    }
    return error.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return '未知错误'
}
