import { useId } from 'react'

import { useLibraryFolderLogo } from '../hooks/use-library-folder-logo'
import CompanyLogoSearch from './company-logo-search'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { APPEARANCE_IMAGE_TYPES } from '@/lib/settings/appearance-image'

export default function LibraryFolderLogoDialog({
  href,
  title,
  source,
  onClose,
}: {
  href: string
  title: string
  source?: string
  onClose: () => void
}) {
  const id = useId()
  const editor = useLibraryFolderLogo(href, source, onClose)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>开发商 LOGO</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>
        <CompanyLogoSearch
          title={title}
          selectedUrl={editor.url}
          onSelect={editor.updateUrl}
          disabled={editor.isReading}
        />
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            if (!editor.isReading) editor.save()
          }}
        >
          <Field>
            <FieldLabel htmlFor={`${id}-url`}>图片链接</FieldLabel>
            <Input
              id={`${id}-url`}
              value={editor.url}
              onChange={(event) => editor.updateUrl(event.target.value)}
              placeholder="https://…"
              maxLength={2048}
              disabled={editor.isReading}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${id}-file`}>或选择本地图片</FieldLabel>
            <Input
              id={`${id}-file`}
              type="file"
              accept={APPEARANCE_IMAGE_TYPES.join(',')}
              disabled={editor.isReading}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                if (file) void editor.chooseFile(file)
                event.currentTarget.value = ''
              }}
            />
            <FieldDescription>
              {editor.localSource ? '已选择本地图片' : '每张本地图片最大 256 KB。'}
            </FieldDescription>
          </Field>
          {editor.error ? (
            <p role="alert" className="text-destructive text-sm">
              {editor.error}
            </p>
          ) : null}
          <DialogFooter>
            {source ? (
              <Button
                type="button"
                variant="outline"
                disabled={editor.isReading}
                onClick={() => editor.save(true)}
              >
                恢复封面拼图
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={editor.isReading || (!editor.url.trim() && !editor.localSource)}
            >
              保存 LOGO
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
