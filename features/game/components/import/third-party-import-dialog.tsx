'use client'

import { useGameLibraryImportProvider } from '../../hooks/use-game-library-import-provider'
import { GameLibraryImportContent } from './game-library-import-content'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { GameLibraryImportProvider } from '../../data/game-library-import-providers'
import type { ReactNode } from 'react'

type ThirdPartyImportDialogProps = {
  children: ReactNode
  provider?: GameLibraryImportProvider
  title?: string
  description?: string
}

export function ThirdPartyImportDialog({
  children,
  provider,
  title,
  description,
}: ThirdPartyImportDialogProps) {
  const { config, providers, selectProvider, providerSelectId, isBusy, setIsBusy } =
    useGameLibraryImportProvider(provider)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-h-[85dvh] flex-col overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {title ?? (provider ? `从 ${config.label} 导入` : '从第三方导入')}
          </DialogTitle>
          <DialogDescription>{description ?? config.description}</DialogDescription>
        </DialogHeader>
        {!provider ? (
          <div className="shrink-0 space-y-2">
            <Label htmlFor={providerSelectId}>导入来源</Label>
            <Select value={config.id} onValueChange={selectProvider} disabled={isBusy}>
              <SelectTrigger id={providerSelectId} className="h-10 w-full sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {providers.map((item) => (
                  <SelectItem key={item.id} value={item.id} className="min-h-10">
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}
        <GameLibraryImportContent key={config.id} provider={config.id} onBusyChange={setIsBusy} />
      </DialogContent>
    </Dialog>
  )
}
