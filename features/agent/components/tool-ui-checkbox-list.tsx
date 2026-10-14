'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

import type { AgentToolUiCheckboxList, AgentToolUiProps } from '@/features/agent/lib/tool-ui'

type ToolUiCheckboxListProps = AgentToolUiProps & {
  ui: AgentToolUiCheckboxList
}

/** 生成式 UI：多选列表（默认全选，确认后把所选项作为下一条用户消息发出） */
export function ToolUiCheckboxList({ ui, onFollowUp, disabled }: ToolUiCheckboxListProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>(() =>
    ui.defaultChecked === false ? [] : ui.items.map((item) => item.id),
  )
  const [confirmed, setConfirmed] = useState(false)

  const allChecked = checkedIds.length === ui.items.length
  const locked = confirmed || disabled

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleConfirm = () => {
    if (locked || checkedIds.length === 0) {
      return
    }
    setConfirmed(true)
    onFollowUp(`${ui.sendPrefix}${checkedIds.join('、')}${ui.sendSuffix ?? ''}`)
  }

  return (
    <div className="bg-muted/40 space-y-2 rounded-lg border p-3">
      <div className="space-y-0.5">
        <div className="text-xs font-medium">{ui.title}</div>
        {ui.description ? (
          <div className="text-muted-foreground text-[11px]">{ui.description}</div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-[11px]">
          <Checkbox
            checked={allChecked}
            disabled={locked}
            onCheckedChange={(value) =>
              setCheckedIds(value === true ? ui.items.map((item) => item.id) : [])
            }
          />
          全选
        </label>
        <span className="text-muted-foreground text-[11px]">已选 {checkedIds.length} 项</span>
      </div>

      <div className="max-h-56 space-y-1 overflow-y-auto">
        {ui.items.map((item) => {
          const checked = checkedIds.includes(item.id)
          return (
            <label
              key={item.id}
              className={`flex cursor-pointer gap-2 rounded-md border p-2 transition-colors ${
                item.image ? 'items-center' : 'items-start'
              } ${checked ? 'border-primary/60 bg-primary/5' : 'hover:bg-accent/40'} ${
                locked ? 'pointer-events-none opacity-60' : ''
              }`}
            >
              <Checkbox
                checked={checked}
                disabled={locked}
                onCheckedChange={() => toggleItem(item.id)}
                className="mt-0.5"
              />
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  className="size-10 shrink-0 rounded object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs">{item.label}</div>
                {item.meta ? (
                  <div className="text-muted-foreground truncate text-[11px]">{item.meta}</div>
                ) : null}
              </div>
              {item.badge ? (
                <span className="bg-muted text-muted-foreground shrink-0 rounded px-1.5 py-0.5 text-[10px]">
                  {item.badge}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>

      <Button
        type="button"
        size="sm"
        className="w-full"
        disabled={locked || checkedIds.length === 0}
        onClick={handleConfirm}
      >
        {confirmed ? '已提交选择' : `${ui.confirmLabel ?? '确认'}（${checkedIds.length}）`}
      </Button>
    </div>
  )
}
