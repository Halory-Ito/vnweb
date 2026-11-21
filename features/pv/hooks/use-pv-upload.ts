import { useState } from 'react'
import { toast } from 'sonner'

import { uploadPvVideo } from '../pv-api'

export function usePvUpload(gameId: string, onSubmit: (url: string) => void) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function handleUpload() {
    if (!selectedFile || !gameId || isUploading) return

    setIsUploading(true)
    setUploadProgress(0)
    try {
      const url = await uploadPvVideo(selectedFile, gameId, (event) => {
        if (event.total) setUploadProgress(Math.round((event.loaded * 100) / event.total))
      })
      if (url) {
        onSubmit(url)
        setSelectedFile(null)
      }
    } catch {
      toast.error('PV 视频上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  return { isUploading, uploadProgress, selectedFile, setSelectedFile, handleUpload }
}
