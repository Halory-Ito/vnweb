'use client'

import { PlusIcon, Trash2Icon, UploadIcon } from 'lucide-react'
import Image from 'next/image'
import { useId } from 'react'

import { useEmptyStateEditor } from '../hooks/use-empty-state-editor'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { APPEARANCE_IMAGE_TYPES } from '@/lib/settings/appearance-image'

type EmptyStateListEditorProps = {
  itemKey: 'kaomoji' | 'images'
  items: string[]
}

export default function EmptyStateListEditor({ itemKey, items }: EmptyStateListEditorProps) {
  const id = useId()
  const editor = useEmptyStateEditor(itemKey)
  const isImage = itemKey === 'images'
  const label = isImage ? '图片' : '颜文字'

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          editor.addDraft()
        }}
      >
        <Field>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id={id}
              value={editor.draft}
              maxLength={isImage ? 2048 : 64}
              onChange={(event) => editor.setDraft(event.target.value)}
              placeholder={isImage ? '输入图片链接' : '输入颜文字'}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="submit"
                size="icon-sm"
                aria-label={`添加${label}`}
                disabled={!editor.draft.trim()}
              >
                <PlusIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {isImage ? (
            <>
              <input
                ref={editor.inputRef}
                type="file"
                multiple
                accept={APPEARANCE_IMAGE_TYPES.join(',')}
                hidden
                onChange={(event) => {
                  if (event.currentTarget.files) void editor.addFiles(event.currentTarget.files)
                  event.currentTarget.value = ''
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={editor.isReading}
                onClick={() => editor.inputRef.current?.click()}
              >
                <UploadIcon />
                {editor.isReading ? '正在读取…' : '选择本地图片'}
              </Button>
              <FieldDescription>可多选，每张本地图片最大 256 KB。</FieldDescription>
            </>
          ) : null}
        </Field>
      </form>
      <ul className="divide-y">
        {items.map((item, index) => (
          <li key={item} className="flex min-w-0 items-center gap-2 py-1.5">
            {isImage ? (
              <Image
                unoptimized
                src={item}
                alt=""
                width={40}
                height={40}
                referrerPolicy="no-referrer"
                className="bg-muted size-10 shrink-0 rounded-sm object-contain"
              />
            ) : null}
            <span className="min-w-0 flex-1 truncate text-sm">
              {isImage && item.startsWith('data:') ? `本地图片 ${index + 1}` : item}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`移除第 ${index + 1} 项${label}`}
              onClick={() => editor.remove(item)}
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
