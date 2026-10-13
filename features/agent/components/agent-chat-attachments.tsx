'use client'

import { FileTextIcon, XIcon } from 'lucide-react'
import Image from 'next/image'

import { formatFileSize } from '../lib/chat-attachments'
import { cn } from '@/lib/utils'

import type { AgentChatAttachment } from '../lib/chat-attachments'

type AgentChatAttachmentsProps = {
  attachments: AgentChatAttachment[]
  /** 传入后显示移除按钮（输入区使用） */
  onRemove?: (id: string) => void
  className?: string
}

/** 附件列表：图片显示缩略图、文本文件显示文件芯片 */
export function AgentChatAttachments({
  attachments,
  onRemove,
  className,
}: AgentChatAttachmentsProps) {
  if (attachments.length === 0) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {attachments.map((attachment) =>
        attachment.kind === 'image' && attachment.dataUrl ? (
          <div
            key={attachment.id}
            className="group bg-muted/40 relative size-16 overflow-hidden rounded-md border"
          >
            <Image
              src={attachment.dataUrl}
              alt={attachment.name}
              fill
              unoptimized
              sizes="64px"
              className="object-contain"
            />

            {onRemove ? (
              <button
                type="button"
                aria-label={`移除 ${attachment.name}`}
                className="bg-background/85 text-foreground absolute top-0.5 right-0.5 flex size-4.5 items-center justify-center rounded-full border opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                onClick={() => onRemove(attachment.id)}
              >
                <XIcon className="size-3" />
              </button>
            ) : null}
          </div>
        ) : (
          <div
            key={attachment.id}
            className="bg-muted/40 flex max-w-56 items-center gap-1.5 rounded-md border py-1 pr-1 pl-2"
          >
            <FileTextIcon className="text-muted-foreground size-3.5 shrink-0" />

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs">{attachment.name}</div>
              <div className="text-muted-foreground text-[10px]">
                {formatFileSize(attachment.size)}
              </div>
            </div>

            {onRemove ? (
              <button
                type="button"
                aria-label={`移除 ${attachment.name}`}
                className="text-muted-foreground hover:text-foreground flex size-5 shrink-0 items-center justify-center rounded transition-colors"
                onClick={() => onRemove(attachment.id)}
              >
                <XIcon className="size-3" />
              </button>
            ) : null}
          </div>
        ),
      )}
    </div>
  )
}
