'use client'

import { PaperclipIcon, SendIcon, SquareIcon } from 'lucide-react'
import { useRef, useState } from 'react'

import { useChatAttachments } from '../hooks/use-chat-attachments'
import { CHAT_ATTACHMENT_ACCEPT, MAX_ATTACHMENTS } from '../lib/chat-attachments'
import { AgentChatAttachments } from './agent-chat-attachments'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

import type { AgentChatAttachment } from '../lib/chat-attachments'

type AgentChatComposerProps = {
  isStreaming: boolean
  disabled: boolean
  toolHint: string
  onSend: (text: string, attachments: AgentChatAttachment[]) => void
  onStop: () => void
}

/** 对话输入区：Enter 发送 / Shift+Enter 换行，支持图片与文本文件附件 */
export function AgentChatComposer({
  isStreaming,
  disabled,
  toolHint,
  onSend,
  onStop,
}: AgentChatComposerProps) {
  const [draft, setDraft] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { attachments, isReading, addFiles, removeAttachment, clearAttachments } =
    useChatAttachments()

  const canSend = (draft.trim().length > 0 || attachments.length > 0) && !isStreaming && !disabled

  const handleSend = () => {
    if (!canSend) {
      return
    }

    const text = draft
    const files = attachments
    setDraft('')
    clearAttachments()
    onSend(text, files)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData?.files ?? [])
    if (files.length === 0) {
      return
    }

    event.preventDefault()
    void addFiles(files)
  }

  return (
    <div className="space-y-2 border-t p-3">
      <AgentChatAttachments attachments={attachments} onRemove={removeAttachment} />

      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        rows={3}
        className="max-h-40 resize-none"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行；可直接粘贴图片"
        disabled={isStreaming || disabled}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="添加附件"
                disabled={
                  isStreaming || disabled || isReading || attachments.length >= MAX_ATTACHMENTS
                }
                onClick={() => fileInputRef.current?.click()}
              >
                <PaperclipIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>添加图片或文本文件（最多 {MAX_ATTACHMENTS} 个）</TooltipContent>
          </Tooltip>

          <span className="text-muted-foreground min-w-0 truncate text-xs">{toolHint}</span>
        </div>

        {isStreaming ? (
          <Button variant="outline" size="sm" onClick={onStop}>
            <SquareIcon />
            停止
          </Button>
        ) : (
          <Button size="sm" disabled={!canSend} onClick={handleSend}>
            <SendIcon />
            发送
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={CHAT_ATTACHMENT_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          void addFiles(files)
        }}
      />
    </div>
  )
}
