// 「导出摘录为 XLSX」WebMCP 工具的定义
export const EXPORT_QUOTE_TOOL_NAME = 'export_quotes_xlsx'

// usewebmcp 使用 JSON Schema（非 Zod），并由 schema 字面量推导 execute 的入参类型
export const exportQuoteToolInputSchema = {
  type: 'object',
  properties: {
    keyword: {
      type: 'string',
      description: '搜索关键词，匹配游戏名称、台词内容、台词背景或角色名称；留空时导出全部摘录',
    },
    dateFrom: {
      type: 'string',
      description: '创建时间起始日期（含），格式 YYYY-MM-DD',
    },
    dateTo: {
      type: 'string',
      description: '创建时间截止日期（含），格式 YYYY-MM-DD',
    },
  },
} as const
