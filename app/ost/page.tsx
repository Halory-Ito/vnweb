'use client'

import { Pagination } from '@/components/custom-pagination'
import { OstDeleteDialog } from '@/features/ost/components/ost-delete-dialog'
import { OstFormDialog } from '@/features/ost/components/ost-form-dialog'
import { OstManageContent } from '@/features/ost/components/ost-manage-content'
import { OstSearchToolbar } from '@/features/ost/components/ost-search-toolbar'
import { useOstManage } from '@/features/ost/hooks/use-ost-manage'

export default function OSTPage() {
  const manage = useOstManage()

  return (
    <div className="max-h-[100cqh] w-full space-y-5 overflow-x-hidden overflow-y-scroll p-4 sm:p-5">
      <OstSearchToolbar
        keywordInput={manage.keywordInput}
        onKeywordInputChange={manage.setKeywordInput}
        onSearch={() => {}}
        onCreate={manage.openCreateDialog}
      />

      <OstManageContent
        items={manage.items}
        selectedItem={manage.selectedItem}
        isLoading={manage.isLoading}
        isRefetching={manage.isRefetching}
        onSelect={manage.selectItem}
        onEdit={manage.openEditDialog}
        onDelete={manage.setPendingDelete}
      />

      <Pagination
        page={manage.page}
        pageSize={manage.pageSize}
        total={manage.total}
        totalPages={manage.totalPages}
        onPageChange={manage.setPage}
        onPageSizeChange={manage.setPageSize}
      />

      <OstFormDialog
        open={manage.dialogOpen}
        editingItem={manage.editingItem}
        isSubmitting={manage.isSubmitting}
        onOpenChange={manage.handleDialogOpenChange}
        onSubmit={manage.handleSubmit}
      />

      <OstDeleteDialog
        item={manage.pendingDelete}
        isSubmitting={manage.isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            manage.setPendingDelete(null)
          }
        }}
        onConfirm={() => void manage.handleDelete()}
      />
    </div>
  )
}
