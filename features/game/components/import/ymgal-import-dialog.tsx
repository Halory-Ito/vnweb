import { ProviderCollectionImportDialog } from './provider-collection-dialog'

import type { GameImportDialogProps } from './types'

export const YmgalImportDialog = ({ children }: GameImportDialogProps) => {
  return (
    <ProviderCollectionImportDialog
      provider="ymgal"
      title="从 YMGal 导入"
      description="必须先绑定 YMGal 账号，然后从用户的游戏列表中导入。"
    >
      {children}
    </ProviderCollectionImportDialog>
  )
}
