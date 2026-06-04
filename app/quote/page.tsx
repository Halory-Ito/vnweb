'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { QuoteDeleteDialog } from './_ui/quote-delete-dialog'
import { QuoteFormDialog } from './_ui/quote-form-dialog'
import { QuoteManageContent } from './_ui/quote-manage-content'
import { QuotePageHeader } from './_ui/quote-page-header'
import { QuoteSearchToolbar } from './_ui/quote-search-toolbar'
import {
  createQuoteManageItem,
  deleteQuoteManageItem,
  getGameCardList,
  getQuoteManageList,
  type QuoteManageItem,
  updateQuoteManageItem,
} from '@/lib/game/game-utils'

import type { GameOption, QuoteFormState } from './_ui/types'

const defaultForm: QuoteFormState = {
  gameId: '',
  content: '',
  characterId: '',
  context: '',
}

export default function QuotePage() {
  const queryClient = useQueryClient()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<QuoteManageItem | null>(
    null,
  )
  const [editingItem, setEditingItem] = useState<QuoteManageItem | null>(null)
  const [form, setForm] = useState<QuoteFormState>(defaultForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
  })

  const {
    data: quoteData,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['quote-manage', keyword, dateFrom, dateTo],
    queryFn: () =>
      getQuoteManageList({
        keyword,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })

  const items = quoteData?.items ?? []

  const gameOptions = useMemo<GameOption[]>(
    () =>
      gameCards.map((game) => ({
        id: String(game.id),
        label: game.title,
      })),
    [gameCards],
  )

  const openCreateDialog = () => {
    setEditingItem(null)
    setForm(defaultForm)
    setDialogOpen(true)
  }

  const openEditDialog = (item: QuoteManageItem) => {
    setEditingItem(item)
    setForm({
      gameId: String(item.gameId),
      content: item.content,
      characterId: item.characterId,
      context: item.context,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
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
        await updateQuoteManageItem(editingItem.id, {
          gameId,
          content,
          characterId,
          context,
        })
        toast.success('摘录已更新')
      } else {
        await createQuoteManageItem({
          gameId,
          content,
          characterId,
          context,
        })
        toast.success('摘录已创建')
      }

      setDialogOpen(false)
      setEditingItem(null)
      setForm(defaultForm)
      await queryClient.invalidateQueries({ queryKey: ['quote-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['game-quotes'] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || '保存摘录失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) {
      return
    }

    setIsSubmitting(true)
    try {
      await deleteQuoteManageItem(pendingDelete.id)
      toast.success('摘录已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['quote-manage'] })
      await queryClient.invalidateQueries({ queryKey: ['game-quotes'] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || '删除摘录失败',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-x-hidden overflow-y-scroll p-4">
      <QuotePageHeader onCreate={openCreateDialog} />

      <QuoteSearchToolbar
        keywordInput={keywordInput}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onKeywordInputChange={setKeywordInput}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onSearch={() => setKeyword(keywordInput.trim())}
        onReset={() => {
          setKeywordInput('')
          setKeyword('')
          setDateFrom('')
          setDateTo('')
          void refetch()
        }}
      />

      <QuoteManageContent
        items={items}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onEdit={openEditDialog}
        onDelete={setPendingDelete}
      />

      <QuoteFormDialog
        open={dialogOpen}
        editingId={editingItem?.id ?? null}
        form={form}
        gameOptions={gameOptions}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingItem(null)
            setForm(defaultForm)
          }
        }}
        onFormChange={setForm}
        onSubmit={() => void handleSubmit()}
      />

      <QuoteDeleteDialog
        item={pendingDelete}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}
