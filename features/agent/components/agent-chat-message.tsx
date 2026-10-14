'use client'

import dynamic from 'next/dynamic'

import { AgentChatAttachments } from './agent-chat-attachments'
import { AgentToolRunCard } from './agent-tool-run-card'
import { Spinner } from '@/components/ui/spinner'

import type { AgentChatUiMessage } from '@/features/agent/lib/chat-types'

// Markdown 渲染依赖体积较大，首次出现消息时才加载
const ChatMarkdown = dynamic(() => import('./chat-markdown'), {
  ssr: false,
  loading: () => <Spinner className="text-muted-foreground" />,
})

function ReasoningBlock({ text, streaming }: { text: string; streaming: boolean }) {
  return (
    <details className="bg-muted/40 rounded-lg border px-3 py-2" open={streaming}>
      <summary className="text-muted-foreground cursor-pointer text-xs select-none">
        思考过程
      </summary>
      <div className="text-muted-foreground mt-2 text-xs whitespace-pre-wrap">{text}</div>
    </details>
  )
}

/** 对话面板中的单条消息 */
export function AgentChatMessage({
  message,
  isStreaming,
  onFollowUp,
}: {
  message: AgentChatUiMessage
  isStreaming: boolean
  onFollowUp: (text: string) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end gap-2">
        <AgentChatAttachments
          attachments={message.attachments ?? []}
          className="max-w-[85%] justify-end"
        />

        {message.content ? (
          <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl px-3.5 py-2 break-words whitespace-pre-wrap">
            <ChatMarkdown content={message.content} variant="user" />
          </div>
        ) : null}
      </div>
    )
  }

  const waiting = isStreaming && !message.content && message.toolRuns.length === 0 && !message.error

  return (
    <div className="space-y-2">
      {message.reasoning ? (
        <ReasoningBlock text={message.reasoning} streaming={isStreaming && !message.content} />
      ) : null}

      {message.content ? <ChatMarkdown content={message.content} /> : null}

      {waiting ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Spinner />
          思考中…
        </div>
      ) : null}

      {message.toolRuns.map((run) => (
        <AgentToolRunCard key={run.id} run={run} onFollowUp={onFollowUp} disabled={isStreaming} />
      ))}

      {message.stopped ? <div className="text-muted-foreground text-xs">已停止生成</div> : null}

      {message.error ? <div className="text-destructive text-sm">{message.error}</div> : null}
    </div>
  )
}
