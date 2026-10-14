'use client'

import { CheckIcon } from 'lucide-react'
import { useState } from 'react'

import type { AgentToolUiOptionPicker, AgentToolUiProps } from '@/features/agent/lib/tool-ui'

type ToolUiOptionPickerProps = AgentToolUiProps & {
  ui: AgentToolUiOptionPicker
}

/** 生成式 UI：单选卡片列表（点一下即把该选项作为下一条用户消息发出） */
export function ToolUiOptionPicker({ ui, onFollowUp, disabled }: ToolUiOptionPickerProps) {
  const [pickedId, setPickedId] = useState<string | null>(null)

  const handlePick = (id: string, send: string) => {
    if (disabled || pickedId) {
      return
    }
    setPickedId(id)
    onFollowUp(send)
  }

  return (
    <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
      <div className="space-y-0.5">
        <div className="text-xs font-medium">{ui.title}</div>
        {ui.description ? (
          <div className="text-muted-foreground text-[11px]">{ui.description}</div>
        ) : null}
      </div>

      <div className="space-y-1.5">
        {ui.options.map((option) => {
          const picked = pickedId === option.id
          const locked = Boolean(pickedId) || disabled

          return (
            <button
              key={option.id}
              type="button"
              disabled={locked}
              onClick={() => handlePick(option.id, option.send)}
              className={`flex w-full items-center gap-2.5 rounded-md border p-2 text-left transition-colors ${
                picked
                  ? 'border-primary bg-primary/5'
                  : locked
                    ? 'opacity-50'
                    : 'hover:border-primary/60 hover:bg-accent/40'
              }`}
            >
              {option.image ? (
                <img
                  src={option.image}
                  alt=""
                  className="size-10 shrink-0 rounded object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="bg-muted size-10 shrink-0 rounded" />
              )}

              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium">{option.title}</div>
                {option.subtitle ? (
                  <div className="text-muted-foreground truncate text-[11px]">
                    {option.subtitle}
                  </div>
                ) : null}
              </div>

              {option.badge ? (
                <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px]">
                  {option.badge}
                </span>
              ) : null}

              {picked ? <CheckIcon className="text-primary size-4 shrink-0" /> : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
