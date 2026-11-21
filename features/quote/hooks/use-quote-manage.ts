'use client'

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<QuoteManageItem | null>(null)
  const [editingItem, setEditingItem] = useState<QuoteManageItem | null>(null)
  const [form, setForm] = useState<QuoteFormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const debouncedKeyword = useDebounce(keywordInput.trim(), 300)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
  })

  const {
    data: quoteData,
    isLoading,
    isRefetching,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey: ['quote-manage', debouncedKeyword],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      getQuoteManageList({
        keyword: debouncedKeyword,
        page: pageParam,
        pageSize: 24,
      }),
    getNextPageParam: ({ pagination }) =>
      pagination.page < pagination.totalPages ? pagination.page + 1 : undefined,
  })

  const items = useMemo(() => quoteData?.pages.flatMap((page) => page.items) ?? [], [quoteData])

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
    setKeywordInput: setKeywordInputState,
    searchKeyword: debouncedKeyword,
    items,
    isLoading,
    isRefetching,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
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
