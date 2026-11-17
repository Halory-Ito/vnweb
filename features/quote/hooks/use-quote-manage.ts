'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  createQuoteManageItem,
  deleteQuoteManageItem,
  getGameCardList,
  getQuoteManageList,
  updateQuoteManageItem,
} from '@/api'
import { useQuoteExportDialog } from '@/features/quote/hooks/use-quote-export-dialog'
import { useDebounce } from '@/hooks/use-debounce'

import type { GameOption, QuoteFormState } from '@/features/quote/types'
import type { QuoteManageItem } from '@/types'

const defaultForm: QuoteFormState = {
  gameId: '',
  content: '',
  characterId: '',
  context: '',
}

export function useQuoteManage() {
  const queryClient = useQueryClient()
  const [keywordInput, setKeywordInputState] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(12)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<QuoteManageItem | null>(null)
  const [editingItem, setEditingItem] = useState<QuoteManageItem | null>(null)
  const [form, setForm] = useState<QuoteFormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [randomSeed, setRandomSeed] = useState(0)

  const debouncedKeyword = useDebounce(keywordInput.trim(), 300)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
  })

  const {
    data: quoteData,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['quote-manage', debouncedKeyword],
    queryFn: () =>
      getQuoteManageList({
        keyword: debouncedKeyword,
        page: 1,
        pageSize: 9999,
      }),
  })

  const allItems = useMemo(() => quoteData?.items ?? [], [quoteData?.items])
  const total = allItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  const items = useMemo(
    () => allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [allItems, currentPage, pageSize],
  )

  const setKeywordInput = useCallback((value: string) => {
    setKeywordInputState(value)
    setPage(1)
  }, [])

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize)
    setPage(1)
  }, [])

  const randomQuote = useMemo(() => {
    if (allItems.length === 0) return null
    const index = (randomSeed * 7 + allItems.length) % allItems.length
    return allItems[index]
  }, [allItems, randomSeed])

  const shuffleRandomQuote = useCallback(() => {
    if (allItems.length <= 1) return
    setRandomSeed((prev) => prev + Math.floor(Math.random() * (allItems.length - 1)) + 1)
  }, [allItems.length])

  const gameOptions = useMemo<GameOption[]>(
    () =>
      gameCards.map((game) => ({
        id: String(game.id),
        label: game.title,
      })),
    [gameCards],
  )

  const exportDialog = useQuoteExportDialog(gameOptions)

  const openCreateDialog = useCallback(() => {
    setEditingItem(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }, [])

  const openEditDialog = useCallback((item: QuoteManageItem) => {
    setEditingItem(item)
    setForm({
      gameId: String(item.gameId),
      content: item.content,
      characterId: item.characterId,
      context: item.context,
    })
    setDialogOpen(true)
  }, [])

  const handleDialogOpenChange = useCallback((open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditingItem(null)
      setForm(defaultForm)
    }
  }, [])

  const handleSubmit = useCallback(async () => {
    const gameId = Number(form.gameId)
    const content = form.content.trim()
    const characterId = form.characterId.trim()
    const context = form.context.trim()

    if (!Number.isInteger(gameId) || gameId <= 0) {
      toast.error('请选择游戏')
      return
    }
    if (!content) {
      toast.error('台词内容不能为空')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingItem) {
        await updateQuoteManageItem(editingItem.id, { gameId, content, characterId, context })
        toast.success('摘录已更新')
      } else {
        await createQuoteManageItem({ gameId, content, characterId, context })
        toast.success('摘录已创建')
      }
      setDialogOpen(false)
      setEditingItem(null)
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['quote-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['game-quotes'] })
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '保存摘录失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [editingItem, form, queryClient])

  const handleDelete = useCallback(async () => {
    if (!pendingDelete) return
    setIsSubmitting(true)
    try {
      await deleteQuoteManageItem(pendingDelete.id)
      toast.success('摘录已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['quote-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['game-quotes'] })
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '删除摘录失败')
    } finally {
      setIsSubmitting(false)
    }
  }, [pendingDelete, queryClient])

  return {
    keywordInput,
    setKeywordInput,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    setPage,
    setPageSize,
    items,
    isLoading,
    isRefetching,
    randomQuote,
    shuffleRandomQuote,
    dialogOpen,
    editingItem,
    form,
    setForm,
    isSubmitting,
    pendingDelete,
    setPendingDelete,
    gameOptions,
    exportDialog,
    openCreateDialog,
    openEditDialog,
    handleDialogOpenChange,
    handleSubmit,
    handleDelete,
  }
}
