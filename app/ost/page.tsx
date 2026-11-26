'use client'

import { Pagination } from '@/components/custom-pagination'
import { OstBatchDeleteControls } from '@/features/ost/components/ost-batch-delete-controls'
import { OstDeleteDialog } from '@/features/ost/components/ost-delete-dialog'
import { OstFormDialog } from '@/features/ost/components/ost-form-dialog'
import { OstManageContent } from '@/features/ost/components/ost-manage-content'
import { OstSearchToolbar } from '@/features/ost/components/ost-search-toolbar'
import { OstShelfTierSelect } from '@/features/ost/components/ost-shelf-tier-select'
import { useOstBatchDelete } from '@/features/ost/hooks/use-ost-batch-delete'
import { useOstManage } from '@/features/ost/hooks/use-ost-manage'

export default function OSTPage() {
  const manage = useOstManage()
  const batch = useOstBatchDelete(manage.items)

  return (
    <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-2 max-h-[100cqh] w-full space-y-5 overflow-x-hidden overflow-y-scroll p-4 motion-safe:duration-200 motion-safe:ease-out sm:p-5">
      <OstSearchToolbar
        keywordInput={manage.keywordInput}
        onKeywordInputChange={manage.setKeywordInput}
        onSearch={() => {}}
        onCreate={manage.openCreateDialog}
        isSelecting={batch.active}
        batchControls={<OstBatchDeleteControls batch={batch} hasItems={manage.items.length > 0} />}
      />

      <OstManageContent
        items={manage.items}
        page={manage.page}
        pageDirection={manage.pageDirection}
        recordsPerTier={manage.recordsPerTier}
        tierCount={manage.tierCount}
        selectedItem={manage.selectedItem}
        batchSelection={batch.active ? batch.selectedIds : undefined}
        isLoading={manage.isLoading}
        isRefetching={manage.isRefetching}
        onSelect={batch.active ? batch.toggle : manage.selectItem}
        onEdit={manage.openEditDialog}
        onDelete={manage.setPendingDelete}
      />

      <Pagination
        page={manage.page}
        pageSize={manage.pageSize}
        total={manage.total}
        totalPages={manage.totalPages}
        itemUnit="张"
        itemName="唱片"
        extraControls={
          <OstShelfTierSelect value={manage.tierCount} onChange={manage.setTierCount} />
        }
        onPageChange={manage.setPage}
        sizeSelection={{ label: '每层', value: manage.recordsPerTier }}
        pageSizeOptions={['5', '10', '15', '20', '25', '50']}
        onPageSizeChange={manage.setRecordsPerTier}
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
        batchCount={batch.pendingCount}
        isSubmitting={manage.isSubmitting || batch.isDeleting}
        onOpenChange={(open) => {
          if (!open) {
            manage.setPendingDelete(null)
            batch.cancelDelete()
          }
        }}
        onConfirm={batch.pendingCount ? batch.confirmDelete : () => void manage.handleDelete()}
      />
    </div>
  )
}
