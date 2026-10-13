// Agent 对话附件：图片转 data URL、文本文件内联为文本，随消息一起发送给模型

import { readImageDataUrl } from './image-attachment'

import type { AgentChatContentPart, AgentChatMessage } from '@/types/agent'

export type AgentChatAttachmentKind = 'image' | 'text'

/** 一条待发送的附件 */
export type AgentChatAttachment = {
  id: string
  kind: AgentChatAttachmentKind
  name: string
  size: number
  /** 图片内容（data URL） */
  dataUrl?: string
  /** 文本文件内容 */
  text?: string
}

/** 单张图片大小上限 */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024
/** 单个文本文件大小上限 */
export const MAX_TEXT_SIZE = 512 * 1024
/** 单条消息最多附件数 */
export const MAX_ATTACHMENTS = 4

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'json',
  'jsonl',
  'csv',
  'tsv',
  'log',
  'yml',
  'yaml',
  'xml',
  'html',
  'htm',
  'css',
  'scss',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'ts',
  'tsx',
  'py',
  'java',
  'kt',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'go',
  'rs',
  'rb',
  'php',
  'sql',
  'sh',
  'bash',
  'ps1',
  'bat',
  'ini',
  'toml',
  'conf',
  'env',
])

/** file input 的 accept 属性 */
export const CHAT_ATTACHMENT_ACCEPT = [
  'image/*',
  ...[...TEXT_EXTENSIONS].map((ext) => `.${ext}`),
].join(',')

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const createAttachmentId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const getExtension = (name: string) => {
  const index = name.lastIndexOf('.')
  return index >= 0 ? name.slice(index + 1).toLowerCase() : ''
}

const isTextFile = (file: File) =>
  file.type.startsWith('text/') ||
  file.type === 'application/json' ||
  file.type === 'application/xml' ||
  TEXT_EXTENSIONS.has(getExtension(file.name))

/** 读取并校验单个文件，转换为附件 */
export const readChatAttachment = async (file: File): Promise<AgentChatAttachment> => {
  const base = {
    id: createAttachmentId(),
    name: file.name || '未命名文件',
    size: file.size,
  }

  if (file.type.startsWith('image/')) {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error(`图片超过 ${formatFileSize(MAX_IMAGE_SIZE)} 上限`)
    }

    return { ...base, kind: 'image', dataUrl: await readImageDataUrl(file) }
  }

  if (isTextFile(file)) {
    if (file.size > MAX_TEXT_SIZE) {
      throw new Error(`文本文件超过 ${formatFileSize(MAX_TEXT_SIZE)} 上限`)
    }

    return { ...base, kind: 'text', text: await file.text() }
  }

  throw new Error('暂不支持该文件类型，仅支持图片与文本文件')
}

/** 将文本与附件组装为 OpenAI 兼容的 user 消息内容 */
export const buildUserContent = (
  text: string,
  attachments: AgentChatAttachment[],
): AgentChatMessage['content'] => {
  if (attachments.length === 0) {
    return text
  }

  const parts: AgentChatContentPart[] = []
  const trimmed = text.trim()

  if (trimmed) {
    parts.push({ type: 'text', text: trimmed })
  }

  for (const attachment of attachments) {
    if (attachment.kind === 'image' && attachment.dataUrl) {
      parts.push({ type: 'image_url', image_url: { url: attachment.dataUrl } })
    } else if (attachment.kind === 'text' && attachment.text) {
      parts.push({ type: 'text', text: `文件：${attachment.name}\n---\n${attachment.text}` })
    }
  }

  return parts.length > 0 ? parts : text
}
