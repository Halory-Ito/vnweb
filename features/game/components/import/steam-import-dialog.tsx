import { ThirdPartyImportDialog } from './third-party-import-dialog'

import type { GameImportDialogProps } from './types'

export const SteamImportDialog = ({ children }: GameImportDialogProps) => (
  <ThirdPartyImportDialog provider="steam">{children}</ThirdPartyImportDialog>
)
