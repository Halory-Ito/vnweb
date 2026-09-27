import { ProviderCollectionImportDialog } from './provider-collection-dialog'

import type { GameImportDialogProps } from './types'

export const BangumiImportDialog = ({ children }: GameImportDialogProps) => {
  return (
    <ProviderCollectionImportDialog
      provider="bangumi"
      title="从 Bangumi 导入"
      description="必须先绑定 Bangumi 账号，然后从该账号的游戏收藏中导入。"
    >
      {children}
    </ProviderCollectionImportDialog>
  )
}
