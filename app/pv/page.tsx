'use client'

import { PvCategoryList } from '@/features/pv/components/pv-category-list'
import { PvDeleteDialog } from '@/features/pv/components/pv-delete-dialog'
import { PvFormDialog } from '@/features/pv/components/pv-form-dialog'
import { PvManageContent } from '@/features/pv/components/pv-manage-content'
import { PvPlayerDialog } from '@/features/pv/components/pv-player-dialog'
import { PvSearchToolbar } from '@/features/pv/components/pv-search-toolbar'
import { usePvManage } from '@/features/pv/hooks/use-pv-manage'

import type { PvMetadata } from '@/types/pv'

export default function PVPage() {
  const pv = usePvManage()
  const formProps = {
    form: pv.form,
    gameOptions: pv.gameOptions,
    isSubmitting: pv.isSubmitting,
    onGameIdChange: (gameId: string) => pv.setForm((current) => ({ ...current, gameId })),
    onNameChange: (name: string) => pv.setForm((current) => ({ ...current, name })),
    onUrlChange: pv.updateUrl,
    onMetadataChange: (metadata: PvMetadata) => pv.setForm((current) => ({ ...current, metadata })),
  }

  return (
    <div className="flex h-full max-h-[100cqh] w-full flex-col gap-5 overflow-hidden p-4 sm:p-5">
      <PvSearchToolbar
        keyword={pv.keyword}
        filters={pv.filters}
        options={pv.filterOptions}
        onSearch={pv.updateKeyword}
        onFilter={pv.updateFilter}
        onCreate={pv.openCreate}
      />
      <div className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] items-start gap-4 md:grid-cols-[9rem_minmax(0,1fr)] md:grid-rows-[minmax(0,1fr)]">
        <PvCategoryList
          categories={pv.categories}
          category={pv.category}
          onChange={pv.updateCategory}
        />
        <div
          role="region"
          aria-label="PV 展示区"
          tabIndex={0}
          className="focus-visible:outline-ring min-h-0 min-w-0 self-stretch overflow-x-hidden overflow-y-auto overscroll-contain"
        >
          <PvManageContent
            items={pv.items}
            total={pv.total}
            hasMore={pv.hasMore}
            isLoading={pv.query.isLoading}
            isError={pv.query.isError}
            onRetry={() => void pv.query.refetch()}
            onSelect={pv.openPreview}
            onLoadMore={pv.loadMore}
          />
        </div>
      </div>
      {pv.creating && (
        <PvFormDialog
          {...formProps}
          open
          onOpenChange={(open) => {
            if (!pv.isSubmitting) pv.setCreating(open)
          }}
          onSubmit={(uploadedUrl) => void pv.save(uploadedUrl)}
        />
      )}
      {pv.activeItem && (
        <PvPlayerDialog
          {...formProps}
          item={pv.activeItem}
          onClose={pv.closePreview}
          onSave={() => void pv.save()}
          onDelete={() => pv.setPendingDelete(pv.activeItem)}
          onDuration={pv.fillDuration}
        />
      )}
      <PvDeleteDialog
        item={pv.pendingDelete}
        isSubmitting={pv.isSubmitting}
        onOpenChange={(open) => {
          if (!open && !pv.isSubmitting) pv.setPendingDelete(null)
        }}
        onConfirm={() => void pv.remove()}
      />
    </div>
  )
}
