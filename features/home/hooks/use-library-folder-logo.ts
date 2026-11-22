import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'

import { saveLibraryFolderLogo } from '../library-folder-logo-api'
import { libraryFolderLogosQuery } from './use-library-folder-logos'
import { isLibraryFolderLogoFile } from '@/lib/library-folder-logo-path'
import { isAppearanceImageUrl, readLocalAppearanceImage } from '@/lib/settings/appearance-image'

type LogoSource = 'remote' | 'local'

export function useLibraryFolderLogo(
  href: string,
  source: string | undefined,
  onClose: () => void,
  localOnly: boolean,
) {
  const queryClient = useQueryClient()
  const isEmbedded = source?.startsWith('data:')
  const isLocal = isEmbedded || isLibraryFolderLogoFile(source)
  const [mode, setMode] = useState<LogoSource>(localOnly || isLocal ? 'local' : 'remote')
  const [url, setUrl] = useState(isLocal ? '' : (source ?? ''))
  const [localSource, setLocalSource] = useState(isEmbedded ? source : undefined)
  const [download, setDownload] = useState(false)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState('')
  const mutation = useMutation({
    mutationFn: saveLibraryFolderLogo,
    onMutate: () => queryClient.cancelQueries({ queryKey: libraryFolderLogosQuery.queryKey }),
    onSuccess({ href, source }) {
      queryClient.setQueryData(libraryFolderLogosQuery.queryKey, (current) => {
        const next = { ...current }
        if (source === null) delete next[href]
        else next[href] = source
        return next
      })
      void queryClient.invalidateQueries({ queryKey: libraryFolderLogosQuery.queryKey })
      onClose()
    },
    onError(cause) {
      const message = isAxiosError<{ error?: string }>(cause)
        ? cause.response?.data?.error
        : undefined
      setError(message || '无法保存 LOGO。')
    },
  })

  async function chooseFile(file: File) {
    setIsReading(true)
    setError('')
    setLocalSource(undefined)
    try {
      setLocalSource(await readLocalAppearanceImage(file))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法读取图片。')
    } finally {
      setIsReading(false)
    }
  }

  function updateUrl(value: string) {
    setUrl(value)
    setError('')
  }

  function updateMode(value: string) {
    if (value === 'local' || value === 'remote') {
      setMode(value)
      setError('')
    }
  }

  const busy = isReading || mutation.isPending
  const value = mode === 'local' ? localSource : url.trim()

  function save(remove = false) {
    if (busy) return
    if (remove) {
      mutation.mutate({ href, source: null })
      return
    }
    if (!value) return
    if (mode === 'remote' && !isAppearanceImageUrl(value)) {
      setError('请输入有效的图片链接。')
      return
    }
    setError('')
    mutation.mutate({ href, source: value, download: mode === 'remote' && download })
  }

  return {
    mode,
    url,
    download,
    busy,
    error,
    canSave: Boolean(value),
    updateMode,
    updateUrl,
    setDownload,
    chooseFile,
    save,
  }
}
