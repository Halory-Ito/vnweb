'use client'

import { ToolUiCheckboxList } from './tool-ui-checkbox-list'
import { ToolUiOptionPicker } from './tool-ui-option-picker'

import type { AgentToolUiProps } from '@/features/agent/lib/tool-ui'

type AgentToolUiPropsBag = AgentToolUiProps & {
  ui: unknown
}

/** 按 ui.kind 分发到对应的生成式 UI 组件；未知 kind 不渲染 */
export function AgentToolUi({ ui, onFollowUp, disabled }: AgentToolUiPropsBag) {
  if (!ui || typeof ui !== 'object') {
    return null
  }

  const kind = (ui as { kind?: unknown }).kind

  if (kind === 'option-picker') {
    return (
      <ToolUiOptionPicker
        ui={ui as Parameters<typeof ToolUiOptionPicker>[0]['ui']}
        onFollowUp={onFollowUp}
        disabled={disabled}
      />
    )
  }

  if (kind === 'checkbox-list') {
    return (
      <ToolUiCheckboxList
        ui={ui as Parameters<typeof ToolUiCheckboxList>[0]['ui']}
        onFollowUp={onFollowUp}
        disabled={disabled}
      />
    )
  }

  return null
}
