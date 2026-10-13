'use client'

import { SendIcon, SquareIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

type AgentChatComposerProps = {
  isStreaming: boolean
  disabled: boolean
  toolHint: string
  onSend: (text: string) => void
  onStop: () => void
}

/** 对话输入区：Enter 发送 / Shift+Enter 换行 */
export function AgentChatComposer({
  isStreaming,
  disabled,
  toolHint,
  onSend,
  onStop,
}: AgentChatComposerProps) {
  const [draft, setDraft] = useState('')

  const handleSend = () => {
    const text = draft.trim()
    if (!text || isStreaming || disabled) {
      return
    }

    setDraft('')
    onSend(text)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-2 border-t p-3">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        rows={3}
        className="max-h-40 resize-none"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        disabled={isStreaming || disabled}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground min-w-0 truncate text-xs">{toolHint}</span>

        {isStreaming ? (
          <Button variant="outline" size="sm" onClick={onStop}>
            <SquareIcon />
            停止
          </Button>
        ) : (
          <Button size="sm" disabled={!draft.trim() || disabled} onClick={handleSend}>
            <SendIcon />
            发送
          </Button>
        )}
      </div>
    </div>
  )
}
