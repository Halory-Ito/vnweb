'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { MAX_ATTACHMENTS, readChatAttachment } from '../lib/chat-attachments'

import type { AgentChatAttachment } from '../lib/chat-attachments'

/** 输入区附件状态：读取、去重上限、移除 */
export function useChatAttachments() {
  const [attachments, setAttachments] = useState<AgentChatAttachment[]>([])
  const [isReading, setIsReading] = useState(false)

  const addFiles = async (files: File[]) => {
    const remaining = MAX_ATTACHMENTS - attachments.length
    if (remaining <= 0) {
      toast.error(`最多只能添加 ${MAX_ATTACHMENTS} 个附件`)
      return
    }

    setIsReading(true)
    try {
      for (const file of files.slice(0, remaining)) {
        try {
          const attachment = await readChatAttachment(file)
          setAttachments((prev) => (prev.length >= MAX_ATTACHMENTS ? prev : [...prev, attachment]))
        } catch (error) {
          toast.error(`${file.name || '文件'}：${(error as Error).message}`)
        }
      }

      if (files.length > remaining) {
        toast.error(`最多只能添加 ${MAX_ATTACHMENTS} 个附件`)
      }
    } finally {
      setIsReading(false)
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id))
  }

  const clearAttachments = () => {
    setAttachments([])
  }

  return { attachments, isReading, addFiles, removeAttachment, clearAttachments }
}
