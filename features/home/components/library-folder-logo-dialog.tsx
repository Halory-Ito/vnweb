import { useId } from 'react'

import { useLibraryFolderLogo } from '../hooks/use-library-folder-logo'
import CompanyLogoSearch from './company-logo-search'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { APPEARANCE_IMAGE_TYPES } from '@/lib/settings/appearance-image'

export default function LibraryFolderLogoDialog({
  href,
  title,
  source,
  localOnly = false,
  onClose,
}: {
  href: string
  title: string
  source?: string
  localOnly?: boolean
  onClose: () => void
}) {
  const id = useId()
  const editor = useLibraryFolderLogo(href, source, onClose, localOnly)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !editor.busy) onClose()
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{localOnly ? '收藏夹 LOGO' : '开发商 LOGO'}</DialogTitle>
        </DialogHeader>
        {!localOnly ? (
          <Field>
            <FieldLabel htmlFor={`${id}-source`}>图片来源</FieldLabel>
            <Select value={editor.mode} onValueChange={editor.updateMode} disabled={editor.busy}>
              <SelectTrigger id={`${id}-source`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="local">本地图片</SelectItem>
                  <SelectItem value="remote">远程链接</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        ) : null}
        {editor.mode === 'remote' ? (
          <CompanyLogoSearch
            title={title}
            selectedUrl={editor.url}
            onSelect={editor.updateUrl}
            disabled={editor.busy}
          />
        ) : null}
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            editor.save()
          }}
        >
          {editor.mode === 'remote' ? (
            <>
              <Field>
                <FieldLabel htmlFor={`${id}-url`}>图片链接</FieldLabel>
                <Input
                  id={`${id}-url`}
                  value={editor.url}
                  onChange={(event) => editor.updateUrl(event.target.value)}
                  placeholder="https://…"
                  maxLength={2048}
                  disabled={editor.busy}
                />
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id={`${id}-download`}
                  checked={editor.download}
                  onCheckedChange={(checked) => editor.setDownload(checked === true)}
                  disabled={editor.busy}
                />
                <FieldLabel htmlFor={`${id}-download`}>下载到本地</FieldLabel>
              </Field>
            </>
          ) : (
            <Field>
              <FieldLabel htmlFor={`${id}-file`}>选择本地图片</FieldLabel>
              <Input
                id={`${id}-file`}
                type="file"
                accept={APPEARANCE_IMAGE_TYPES.join(',')}
                disabled={editor.busy}
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0]
                  if (file) void editor.chooseFile(file)
                }}
              />
            </Field>
          )}
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
                disabled={editor.busy}
                onClick={() => editor.save(true)}
              >
                恢复封面拼图
              </Button>
            ) : null}
            <Button type="submit" disabled={editor.busy || !editor.canSave}>
              保存 LOGO
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
