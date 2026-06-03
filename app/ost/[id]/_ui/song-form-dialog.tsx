'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  FileAudioIcon,
  FileTextIcon,
  LinkIcon,
  SaveIcon,
  XIcon,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import type { OstSongItem } from '@/lib/game/game-utils'

const formSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  url: z.string().url('请输入有效的音频 URL'),
  mediaType: z.string().optional(),
  lyricsText: z.string().optional(),
  lyricsPath: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type SongFormDialogProps = {
  open: boolean
  editingItem: OstSongItem | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: FormValues) => Promise<void>
}

export function SongFormDialog({
  open,
  editingItem,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: SongFormDialogProps) {
  const isEditing = !!editingItem

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      url: '',
      mediaType: '',
      lyricsText: '',
      lyricsPath: '',
    },
  })

  // 每次打开对话框时，重置表单状态
  useEffect(() => {
    if (open) {
      if (editingItem) {
        form.reset({
          name: editingItem.name,
          url: editingItem.url,
          mediaType: editingItem.mediaType || '',
          lyricsText: editingItem.lyricsText || '',
          lyricsPath: editingItem.lyricsPath || '',
        })
      } else {
        form.reset({
          name: '',
          url: '',
          mediaType: '',
          lyricsText: '',
          lyricsPath: '',
        })
      }
    }
  }, [open, editingItem, form])

  const handleSubmit = async (values: FormValues) => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
              <FileAudioIcon className="size-4" />
            </div>
            {isEditing ? '编辑歌曲' : '添加歌曲'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? '修改歌曲的信息' : '为当前专辑添加一首新歌曲'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    歌曲名称 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="输入歌曲名称，例如：Track 01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    音频 URL <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LinkIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                      <Input
                        className="pl-9"
                        placeholder="https://example.com/audio.mp3"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    请输入可访问的音频文件下载或流媒体链接
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mediaType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>编解码类型 / 拓展名</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：mp3, flac, aac" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lyricsPath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>歌词文件路径</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：/lyrics/song.lrc" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="lyricsText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>歌词文本</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileTextIcon className="text-muted-foreground absolute top-3 left-3 size-4" />
                      <Textarea
                        className="min-h-24 resize-y pl-9"
                        placeholder="粘贴歌词文本内容（可选）"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    可以直接粘贴歌词文本，或留空并在歌词路径中指定 .lrc 文件
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                <XIcon className="mr-2 size-4" />
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    保存中...
                  </>
                ) : (
                  <>
                    <SaveIcon className="mr-2 size-4" />
                    {isEditing ? '保存修改' : '确认添加'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
