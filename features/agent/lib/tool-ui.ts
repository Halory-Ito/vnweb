// 生成式 UI：工具结果里携带的界面描述（kind 决定渲染哪个组件）

/** 单选卡片的一个候选项 */
export type AgentToolUiOption = {
  id: string
  title: string
  subtitle?: string
  image?: string
  badge?: string
  /** 用户点选后作为下一条用户消息发送的文本 */
  send: string
}

/** 多选列表的一项 */
export type AgentToolUiCheckboxItem = {
  id: string
  label: string
  meta?: string
  /** 可选缩略图（如专辑封面） */
  image?: string
  /** 可选右侧徽标（如音源名称） */
  badge?: string
}

/** 单选卡片列表：让用户在工具给出的候选里挑一个 */
export type AgentToolUiOptionPicker = {
  kind: 'option-picker'
  title: string
  description?: string
  options: AgentToolUiOption[]
}

/** 多选列表：让用户勾选若干项后确认 */
export type AgentToolUiCheckboxList = {
  kind: 'checkbox-list'
  title: string
  description?: string
  items: AgentToolUiCheckboxItem[]
  /** 初始是否全选，默认 true；涉及写库的批量选择建议传 false */
  defaultChecked?: boolean
  confirmLabel?: string
  /** 确认时拼接：sendPrefix + 已勾选 id（顿号分隔）+ sendSuffix */
  sendPrefix: string
  sendSuffix?: string
}

export type AgentToolUi = AgentToolUiOptionPicker | AgentToolUiCheckboxList

/** 生成式 UI 组件统一入参（ui 已按 kind 收窄） */
export type AgentToolUiProps = {
  onFollowUp: (text: string) => void
  disabled?: boolean
}

/** 已知的 ui kind，用于校验工具结果 */
export const AGENT_TOOL_UI_KINDS = ['option-picker', 'checkbox-list'] as const

export const isAgentToolUi = (value: unknown): value is AgentToolUi => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const kind = (value as { kind?: unknown }).kind
  return typeof kind === 'string' && (AGENT_TOOL_UI_KINDS as readonly string[]).includes(kind)
}
