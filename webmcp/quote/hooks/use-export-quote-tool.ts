'use client'

import { useWebMCP } from 'usewebmcp'

import { useExportQuoteXlsx } from '@/features/quote/hooks/use-export-quote-xlsx'
import {
  EXPORT_QUOTE_TOOL_NAME,
  exportQuoteToolInputSchema,
} from '@/webmcp/quote/lib/export-quote-tool-schema'

/**
 * 注册「导出摘录为 XLSX」工具：
 * 按可选的关键词 / 创建时间范围筛选摘录，生成独立的 xlsx 文件并下载到本地。
 */
export const useExportQuoteTool = () => {
  const { exportQuotes } = useExportQuoteXlsx()

  useWebMCP({
    name: EXPORT_QUOTE_TOOL_NAME,
    description:
      '将游戏台词摘录导出为独立的 XLSX 文件并下载到本地。可按关键词或创建时间范围筛选；不传参数时导出全部摘录。文件包含序号、游戏名称、游戏原名、台词内容、出自角色、台词背景、创建时间。',
    inputSchema: exportQuoteToolInputSchema,
    annotations: { readOnlyHint: true },
    execute: async (input) =>
      exportQuotes({
        keyword: input.keyword,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo,
      }),
  })
}
