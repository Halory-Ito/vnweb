'use client'

import { motion } from 'motion/react'

import { QuoteDeleteDialog } from '@/features/quote/components/quote-delete-dialog'
import { QuoteExportDialog } from '@/features/quote/components/quote-export-dialog'
import { QuoteFormDialog } from '@/features/quote/components/quote-form-dialog'
import { QuoteManageContent } from '@/features/quote/components/quote-manage-content'
import { QuotePagination } from '@/features/quote/components/quote-pagination'
import { QuoteToolArea } from '@/features/quote/components/quote-tool-area'
import { useQuoteManage } from '@/features/quote/hooks/use-quote-manage'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
} as const

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
} as const

export default function QuotePage() {
  const manage = useQuoteManage()

  return (
    <motion.div
      className="max-h-[100cqh] w-full space-y-5 overflow-x-hidden overflow-y-scroll p-4 sm:p-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <QuoteToolArea
          keywordInput={manage.keywordInput}
          isExporting={manage.exportDialog.isExporting}
          onKeywordInputChange={manage.setKeywordInput}
          onSearch={() => {}}
          onCreate={manage.openCreateDialog}
          onExport={manage.exportDialog.openDialog}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuoteManageContent
          items={manage.items}
          isLoading={manage.isLoading}
          isRefetching={manage.isRefetching}
          onEdit={manage.openEditDialog}
          onDelete={manage.setPendingDelete}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuotePagination
          page={manage.page}
          pageSize={manage.pageSize}
          total={manage.total}
          totalPages={manage.totalPages}
          onPageChange={manage.setPage}
          onPageSizeChange={manage.setPageSize}
        />
      </motion.div>

      <QuoteFormDialog
        open={manage.dialogOpen}
        editingId={manage.editingItem?.id ?? null}
        form={manage.form}
        gameOptions={manage.gameOptions}
        isSubmitting={manage.isSubmitting}
        onOpenChange={manage.handleDialogOpenChange}
        onFormChange={manage.setForm}
        onSubmit={() => void manage.handleSubmit()}
      />

      <QuoteDeleteDialog
        item={manage.pendingDelete}
        isSubmitting={manage.isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            manage.setPendingDelete(null)
          }
        }}
        onConfirm={() => void manage.handleDelete()}
      />

      <QuoteExportDialog
        open={manage.exportDialog.open}
        gameOptions={manage.gameOptions}
        selectedGameIds={manage.exportDialog.selectedGameIds}
        method={manage.exportDialog.method}
        isExporting={manage.exportDialog.isExporting}
        allSelected={manage.exportDialog.allSelected}
        someSelected={manage.exportDialog.someSelected}
        onOpenChange={manage.exportDialog.setOpen}
        onToggleGame={manage.exportDialog.toggleGame}
        onToggleAll={manage.exportDialog.toggleAll}
        onMethodChange={manage.exportDialog.setMethod}
        onSubmit={() => void manage.exportDialog.submit()}
      />
    </motion.div>
  )
}
