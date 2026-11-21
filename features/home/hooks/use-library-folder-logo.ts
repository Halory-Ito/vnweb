import { useSetAtom } from 'jotai'
import { useState } from 'react'

import { isAppearanceImageUrl, readLocalAppearanceImage } from '@/lib/settings/appearance-image'
import { folderLogosAtom } from '@/lib/settings/game-library-folder-logos'

export function useLibraryFolderLogo(
  href: string,
  source: string | undefined,
  onClose: () => void,
) {
  const updateLogo = useSetAtom(folderLogosAtom)
  const [url, setUrl] = useState(source?.startsWith('data:') ? '' : (source ?? ''))
  const [localSource, setLocalSource] = useState(source?.startsWith('data:') ? source : undefined)
  const [isReading, setIsReading] = useState(false)
  const [error, setError] = useState('')

  async function chooseFile(file: File) {
    setIsReading(true)
    setError('')
    try {
      setLocalSource(await readLocalAppearanceImage(file))
      setUrl('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法读取图片。')
    } finally {
      setIsReading(false)
    }
  }

  function updateUrl(value: string) {
    setUrl(value)
    setLocalSource(undefined)
    setError('')
  }

  function save(remove = false) {
    const value = url.trim()
    if (!remove && !localSource && !isAppearanceImageUrl(value)) {
      setError('请输入 HTTP、HTTPS 图片链接或站内图片路径。')
      return
    }
    try {
      updateLogo(href, remove ? undefined : (localSource ?? value))
      onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '无法保存 LOGO。')
    }
  }

  return { url, localSource, isReading, error, updateUrl, chooseFile, save }
}
