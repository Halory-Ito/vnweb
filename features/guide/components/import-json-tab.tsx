'use client'

import { ChevronsUpDown, Copy, FileJson } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { AI_IMPORT_PROMPT } from '@/features/guide/data/import-guide-prompt'

type ImportJsonTabProps = {
  jsonText: string
  jsonError: string | null
  onJsonTextChange: (value: string) => void
}

export default function ImportJsonTab({
  jsonText,
  jsonError,
  onJsonTextChange,
}: ImportJsonTabProps) {
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_IMPORT_PROMPT)
      toast.success('AI 提示词已复制')
    } catch {
      toast.error('复制失败，请手动复制')
    }
  }

  return (
    <div className="space-y-4">
      {/* 提示词复制 */}
      <Collapsible defaultOpen={false}>
        <div className="flex items-center justify-between rounded-md border px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <FileJson className="text-muted-foreground h-4 w-4" />
            <span>格式说明 & AI 提示词</span>
          </div>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8">
              <ChevronsUpDown className="h-4 w-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="space-y-2 pt-2">
          <p className="text-muted-foreground text-xs">
            粘贴的 JSON 需要包含 name、routes、endings 和 steps。支持 choice / save / load / note
            四种步骤类型。
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCopyPrompt}
          >
            <Copy className="h-4 w-4" />
            复制 AI 提示词
          </Button>
        </CollapsibleContent>
      </Collapsible>

      {/* JSON 输入 */}
      <div className="space-y-2">
        <div className="text-sm font-medium">攻略 JSON</div>
        <Textarea
          placeholder="将 AI 生成的攻略 JSON 粘贴到此处..."
          value={jsonText}
          onChange={(event) => onJsonTextChange(event.target.value)}
          className="max-h-32 overflow-y-auto font-mono text-sm"
        />
        {jsonError ? (
          <p className="text-destructive text-xs">{jsonError}</p>
        ) : jsonText.trim() ? (
          <p className="text-success text-xs">JSON 格式正确</p>
        ) : null}
      </div>
    </div>
  )
}
