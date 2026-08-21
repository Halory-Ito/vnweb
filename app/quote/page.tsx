'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { QuoteDeleteDialog } from '@/features/quote/components/quote-delete-dialog'
import { QuoteFormDialog } from '@/features/quote/components/quote-form-dialog'
import { QuoteManageContent } from '@/features/quote/components/quote-manage-content'
import { QuotePagination } from '@/features/quote/components/quote-pagination'
import { QuoteToolArea } from '@/features/quote/components/quote-tool-area'
import { useDebounce } from '@/hooks/use-debounce'
import {
  createQuoteManageItem,
  deleteQuoteManageItem,
  getGameCardList,
  getQuoteManageList,
  type QuoteManageItem,
  updateQuoteManageItem,
} from '@/lib/game/game-utils'

import type { GameOption, QuoteFormState } from './_ui/types'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

const defaultForm: QuoteFormState = {
  gameId: '',
  content: '',
  characterId: '',
  context: '',
}

export default function QuotePage() {
  const queryClient = useQueryClient()
  const [keywordInput, setKeywordInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
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
    refetch,
  } = useQuery({
    queryKey: ['quote-manage', debouncedKeyword],
    queryFn: () =>
      getQuoteManageList({
        keyword: debouncedKeyword,
        page: 1,
        pageSize: 9999,
      }),
  })

  const allItems = quoteData?.items ?? []
  const total = allItems.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)
  const items = useMemo(
    () => allItems.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [allItems, currentPage, pageSize],
  )

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

  const handleSearch = () => {
    // 搜索逻辑由 debouncedKeyword 自动处理
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
      toast.error(err.response?.data?.error || err.message || '保存摘录失败')
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
      toast.error(err.response?.data?.error || err.message || '删除摘录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-x-hidden overflow-y-scroll p-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <QuoteToolArea
          keywordInput={keywordInput}
          onKeywordInputChange={(value: string) => {
            setKeywordInput(value)
            setPage(1)
          }}
          onSearch={handleSearch}
          onCreate={openCreateDialog}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuoteManageContent
          items={items}
          isLoading={isLoading}
          isRefetching={isRefetching}
          onEdit={openEditDialog}
          onDelete={setPendingDelete}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuotePagination
          page={currentPage}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setPage(1)
          }}
        />
      </motion.div>

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
    </motion.div>
  )
}