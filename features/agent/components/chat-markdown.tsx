'use client'

import Markdown, { type Components } from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

export type ChatMarkdownVariant = 'assistant' | 'user'

/** 用户气泡为 primary 底色，行内代码、链接等需要切换为浅色系 */
function createComponents(variant: ChatMarkdownVariant): Components {
  const isUser = variant === 'user'

  const inlineCodeClass = isUser
    ? 'bg-primary-foreground/20 rounded px-1 py-0.5 font-mono text-[0.85em]'
    : 'bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]'

  const linkClass = isUser
    ? 'text-primary-foreground underline underline-offset-2 hover:opacity-80'
    : 'text-primary underline underline-offset-2 hover:opacity-80'

  const blockquoteClass = isUser
    ? 'border-primary-foreground/40 text-primary-foreground/80 my-2 border-l-2 pl-3'
    : 'border-primary/40 text-muted-foreground my-2 border-l-2 pl-3'

  const borderClass = isUser ? 'border-primary-foreground/30' : 'border'

  return {
    p: ({ children }) => <p className="my-2 leading-relaxed first:mt-0 last:mb-0">{children}</p>,
    h1: ({ children }) => <h1 className="mt-4 mb-2 text-base font-semibold">{children}</h1>,
    h2: ({ children }) => <h2 className="mt-4 mb-2 text-sm font-semibold">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-3 mb-1.5 text-sm font-semibold">{children}</h3>,
    h4: ({ children }) => <h4 className="mt-3 mb-1.5 text-sm font-medium">{children}</h4>,
    ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
    ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
    li: ({ children }) => (
      <li
        className={cn(
          'leading-relaxed',
          isUser ? 'marker:text-primary-foreground/60' : 'marker:text-muted-foreground',
        )}
      >
        {children}
      </li>
    ),
    blockquote: ({ children }) => <blockquote className={blockquoteClass}>{children}</blockquote>,
    hr: () => (
      <hr className={cn('my-3', isUser ? 'border-primary-foreground/30' : 'border-border')} />
    ),
    a: ({ children, href }) => (
      <a href={href} className={linkClass} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    img: ({ src, alt }) => <img src={src} alt={alt ?? ''} className="my-2 max-w-full rounded-md" />,
    table: ({ children }) => (
      <div className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-xs">{children}</table>
      </div>
    ),
    th: ({ children }) => (
      <th
        className={cn(
          'border px-2 py-1 text-left font-medium',
          isUser ? 'border-primary-foreground/30 bg-primary-foreground/10' : 'bg-muted/50',
        )}
      >
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className={cn('border px-2 py-1 align-top', borderClass)}>{children}</td>
    ),
    pre: ({ children }) => (
      <pre className="my-2 overflow-x-auto rounded-lg border bg-[#282c34] p-3 text-xs [&_code]:bg-transparent [&_code]:p-0">
        {children}
      </pre>
    ),
    code: ({ className, children }) => {
      const isBlock =
        typeof className === 'string' &&
        (className.includes('language-') || className.includes('hljs'))

      if (isBlock) {
        return <code className={className}>{children}</code>
      }

      return <code className={cn(inlineCodeClass, className)}>{children}</code>
    },
  }
}

const assistantComponents = createComponents('assistant')
const userComponents = createComponents('user')

/** 消息的 Markdown 渲染（动态加载，避免进入全局布局主包） */
export default function ChatMarkdown({
  content,
  variant = 'assistant',
}: {
  content: string
  variant?: ChatMarkdownVariant
}) {
  return (
    <div className="min-w-0 text-sm break-words">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { ignoreMissing: true }]]}
        components={variant === 'user' ? userComponents : assistantComponents}
      >
        {content}
      </Markdown>
    </div>
  )
}
