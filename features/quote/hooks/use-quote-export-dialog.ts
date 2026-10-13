'use client'

import { useState } from 'react'

import { useExportQuoteXlsx } from '@/features/quote/hooks/use-export-quote-xlsx'

import type { GameOption } from '@/features/quote/types'

// 目前仅支持导出为 xlsx，后续可扩展更多方式
export type QuoteExportMethod = 'xlsx'

/**
 * 「导出摘录」对话框的状态与提交逻辑：
 * 选择需要导出的游戏（默认全选）、导出方式，然后触发导出。
 */
export const useQuoteExportDialog = (gameOptions: GameOption[]) => {
  const { isExporting, exportQuotes } = useExportQuoteXlsx()
  const [open, setOpen] = useState(false)
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([])
  const [method, setMethod] = useState<QuoteExportMethod>('xlsx')

  const allSelected = gameOptions.length > 0 && selectedGameIds.length === gameOptions.length
  const someSelected = selectedGameIds.length > 0 && !allSelected

  const openDialog = () => {
    setSelectedGameIds(gameOptions.map((game) => game.id))
    setMethod('xlsx')
    setOpen(true)
  }

  const toggleGame = (id: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const toggleAll = () => {
    setSelectedGameIds((prev) =>
      prev.length === gameOptions.length ? [] : gameOptions.map((game) => game.id),
    )
  }

  const submit = async () => {
    // 全选或没有任何游戏时按「全部」导出，不附加 gameIds 过滤
    const isAll = selectedGameIds.length === 0 || selectedGameIds.length === gameOptions.length
    const gameIds = isAll
      ? undefined
      : selectedGameIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)

    const result = await exportQuotes({ gameIds })

    if (result.exported) {
      setOpen(false)
    }
  }

  return {
    open,
    setOpen,
    method,
    setMethod,
    selectedGameIds,
    allSelected,
    someSelected,
    openDialog,
    toggleGame,
    toggleAll,
    submit,
    isExporting,
  }
}
