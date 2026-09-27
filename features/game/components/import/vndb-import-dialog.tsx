import { ProviderCollectionImportDialog } from './provider-collection-dialog'

import type { GameImportDialogProps } from './types'

export const VndbImportDialog = ({ children }: GameImportDialogProps) => {
  return (
    <ProviderCollectionImportDialog
      provider="vndb"
      title="从 VNDB 导入"
      description="必须先绑定 VNDB 账号，然后从 My Visual Novel List 中导入。"
    >
      {children}
    </ProviderCollectionImportDialog>
  )
}
