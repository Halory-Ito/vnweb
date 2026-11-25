'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { exportQuoteXlsxApi } from '@/api'
import { saveExport } from '@/lib/save-export'

export type ExportQuoteXlsxParams = {
  keyword?: string
  dateFrom?: string
  dateTo?: string
  gameIds?: number[]
}

export type ExportQuoteXlsxResult = {
  exported: boolean
  count: number
  fileName: string
}

/**
 * 导出摘录为独立 XLSX 文件，桌面端使用原生另存为，网页端交给浏览器下载。
 * 供页面手动导出按钮与 WebMCP 工具 `export_quotes_xlsx` 复用。
 */
export const useExportQuoteXlsx = () => {
  const [isExporting, setIsExporting] = useState(false)

  const exportQuotes = async (params?: ExportQuoteXlsxParams): Promise<ExportQuoteXlsxResult> => {
    setIsExporting(true)

    try {
      const { blob, fileName, count } = await exportQuoteXlsxApi(params)

      if (count <= 0) {
        toast.warning('没有符合条件的摘录可导出')
        return { exported: false, count: 0, fileName: '' }
      }

      const saved = await saveExport(blob, fileName)
      if (!saved) return { exported: false, count: 0, fileName: '' }

      toast.success('已导出 ' + count + ' 条摘录', { description: saved.path ?? fileName })

      return { exported: true, count, fileName }
    } finally {
      setIsExporting(false)
    }
  }

  return { isExporting, exportQuotes }
}
