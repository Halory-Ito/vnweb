'use client'

import {
  ChevronDownIcon,
  DatabaseIcon,
  FilmIcon,
  Gamepad2Icon,
  ImageIcon,
  type LucideIcon,
  MusicIcon,
  SlidersHorizontalIcon,
  TypeIcon,
} from 'lucide-react'
import { useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useBackupSettingsContext } from '@/features/backup/context/backup-settings-context'
import {
  BACKUP_IMAGE_KEYS,
  BACKUP_IMAGE_LABELS,
  countSelectedImageCategories,
  getImagesSelectionState,
  setAllImagesSelected,
} from '@/lib/backup-content'
import { cn } from '@/lib/utils'

type SimpleToggleKey = 'video' | 'audio' | 'font'

const MEDIA_TOGGLE_ITEMS: Array<{ key: SimpleToggleKey; label: string; icon: LucideIcon }> = [
  { key: 'video', label: '视频', icon: FilmIcon },
  { key: 'audio', label: '音频', icon: MusicIcon },
  { key: 'font', label: '字体', icon: TypeIcon },
]

export function BackupContentSection() {
  const { gameSaveEnabled, backupContent, isLoadingBackupContent, updateBackupContent } =
    useBackupSettingsContext()
  const [imagesExpanded, setImagesExpanded] = useState(true)

  const selectedImageCount = countSelectedImageCategories(backupContent.images)
  const imageSelectionState = getImagesSelectionState(backupContent.images)

  return (
    <section
      aria-labelledby="backup-content-settings"
      className="dark:border-input dark:bg-input/20 space-y-4 rounded-xl border p-4 sm:p-6"
    >
      <h2 id="backup-content-settings" className="text-base font-semibold">
        备份内容
      </h2>

      {isLoadingBackupContent ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="divide-border/60 divide-y">
          <div className="flex min-h-11 items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <Checkbox id="backup-content-db" checked disabled />
              <DatabaseIcon className="text-muted-foreground size-4 shrink-0" />
              <Label htmlFor="backup-content-db">数据库</Label>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              必选
            </Badge>
          </div>

          <div className="flex min-h-11 items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <Checkbox id="backup-content-settings" checked disabled />
              <SlidersHorizontalIcon className="text-muted-foreground size-4 shrink-0" />
              <Label htmlFor="backup-content-settings">设置文件</Label>
            </div>
            <Badge variant="outline" className="text-xs font-normal">
              必选
            </Badge>
          </div>

          <div className="flex min-h-11 items-center justify-between gap-3 py-2.5">
            <div className="flex items-center gap-3">
              <Checkbox
                id="backup-content-saves"
                checked={backupContent.gameSaves}
                onCheckedChange={(checked) =>
                  void updateBackupContent({ ...backupContent, gameSaves: checked === true })
                }
              />
              <Gamepad2Icon className="text-muted-foreground size-4 shrink-0" />
              <Label htmlFor="backup-content-saves" className="cursor-pointer">
                游戏存档
              </Label>
            </div>
            {!gameSaveEnabled ? (
              <Badge variant="outline" className="text-xs font-normal">
                未启用
              </Badge>
            ) : null}
          </div>

          <Collapsible open={imagesExpanded} onOpenChange={setImagesExpanded} className="py-2.5">
            <div className="flex min-h-7 items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="backup-content-images"
                  checked={imageSelectionState}
                  onCheckedChange={(checked) =>
                    void updateBackupContent(setAllImagesSelected(backupContent, checked === true))
                  }
                />
                <ImageIcon className="text-muted-foreground size-4 shrink-0" />
                <Label htmlFor="backup-content-images" className="cursor-pointer">
                  图片
                </Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {selectedImageCount}/{BACKUP_IMAGE_KEYS.length}
                </span>
              </div>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  aria-label={imagesExpanded ? '收起图片分类' : '展开图片分类'}
                >
                  <ChevronDownIcon
                    className={cn('size-3.5 transition-transform', imagesExpanded && 'rotate-180')}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <div className="grid grid-cols-2 gap-2.5 pt-3 pb-1 pl-7 sm:grid-cols-3 lg:grid-cols-4">
                {BACKUP_IMAGE_KEYS.map((key) => {
                  const id = `backup-content-image-${key}`
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={backupContent.images[key]}
                        onCheckedChange={(checked) =>
                          void updateBackupContent({
                            ...backupContent,
                            images: { ...backupContent.images, [key]: checked === true },
                          })
                        }
                      />
                      <Label htmlFor={id} className="cursor-pointer text-sm font-normal">
                        {BACKUP_IMAGE_LABELS[key]}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {MEDIA_TOGGLE_ITEMS.map(({ key, label, icon: Icon }) => {
            const id = `backup-content-${key}`
            return (
              <div key={key} className="flex min-h-11 items-center gap-3 py-2.5">
                <Checkbox
                  id={id}
                  checked={backupContent[key]}
                  onCheckedChange={(checked) =>
                    void updateBackupContent({ ...backupContent, [key]: checked === true })
                  }
                />
                <Icon className="text-muted-foreground size-4 shrink-0" />
                <Label htmlFor={id} className="cursor-pointer">
                  {label}
                </Label>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
