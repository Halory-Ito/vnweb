import { ThirdPartyImportDialog } from './third-party-import-dialog'

import type { GameLibraryImportProvider } from '../../data/game-library-import-providers'
import type { ReactNode } from 'react'

type ProviderCollectionImportDialogProps = {
  children: ReactNode
  provider: Exclude<GameLibraryImportProvider, 'steam'>
  title: string
  description: string
}

export const ProviderCollectionImportDialog = (props: ProviderCollectionImportDialogProps) => (
  <ThirdPartyImportDialog {...props} />
)
