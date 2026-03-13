'use client'

import { Pencil, Search, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createGameOstById,
  createGamePvById,
  deleteGameOstById,
  deleteGamePvById,
  getGameOstsById,
  getGamePvsById,
  type GameMediaLinkItem,
  importLocalGameOstById,
  importLocalGamePvById,
  uploadGameOstLyricById,
  updateGameOstById,
  updateGamePvById,
} from '@/lib/game-utils'

type GameMediaManagerProps = {
  gameId: number
  mediaType: 'pv' | 'ost'
}

const PAGE_SIZE = 5

const AUDIO_EXT_PATTERN = /\.(mp3|wav|flac|aac|ogg|m4a|wma|opus)$/i

const normalizeBaseName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '')

const getFileBaseName = (fileName: string) => fileName.replace(/\.[^.]+$/, '')

const isLyricFile = (file: File) => /\.lrc$/i.test(file.name)

const isAudioFile = (file: File) => {
  if (file.type.startsWith('audio/')) {
    return true
  }
  return AUDIO_EXT_PATTERN.test(file.name)
}

export default function GameMediaManager({
  gameId,
  mediaType,
}: GameMediaManagerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [items, setItems] = useState<GameMediaLinkItem[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')

  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<GameMediaLinkItem | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isPv = mediaType === 'pv'
  const typeText = isPv ? 'PV' : 'OST'

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = isPv
        ? await getGamePvsById(gameId)
        : await getGameOstsById(gameId)
      setItems(data.items)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || `加载${typeText}失败`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [gameId, mediaType])

  const filteredItems = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    if (!keyword) {
      return items
    }
    return items.filter((item) => {
      return (
        item.name.toLowerCase().includes(keyword) ||
        item.url.toLowerCase().includes(keyword)
      )
    })
  }, [items, searchKeyword])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)),
    [filteredItems.length],
  )

  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [currentPage, filteredItems])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchKeyword])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleAdd = async () => {
    const name = newName.trim()
    const url = newUrl.trim()
    if (!name || !url) {
      toast.error(`请填写${typeText}名称和链接`)
      return
    }

    setIsSubmitting(true)
    try {
      if (isPv) {
        await createGamePvById(gameId, { name, url })
      } else {
        await createGameOstById(gameId, { name, url })
      }

      setNewName('')
      setNewUrl('')
      await loadData()
      toast.success(`${typeText}已添加`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || `添加${typeText}失败`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (item: GameMediaLinkItem) => {
    setEditingId(item.id)
    setEditName(item.name)
    setEditUrl(item.url)
  }

  const handleSaveEdit = async () => {
    if (!editingId) {
      return
    }

    const name = editName.trim()
    const url = editUrl.trim()
    if (!name || !url) {
      toast.error(`请填写完整的${typeText}信息`)
      return
    }

    setIsSubmitting(true)
    try {
      if (isPv) {
        await updateGamePvById(gameId, {
          itemId: editingId,
          name,
          url,
        })
      } else {
        await updateGameOstById(gameId, {
          itemId: editingId,
          name,
          url,
        })
      }

      setEditingId(null)
      setEditName('')
      setEditUrl('')
      await loadData()
      toast.success(`${typeText}已更新`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || `更新${typeText}失败`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: GameMediaLinkItem) => {
    if (isSubmitting) {
      return
    }

    setIsSubmitting(true)
    try {
      if (isPv) {
        await deleteGamePvById(gameId, item.id)
      } else {
        await deleteGameOstById(gameId, item.id)
      }

      if (editingId === item.id) {
        setEditingId(null)
      }

      setPendingDeleteItem(null)
      await loadData()
      toast.success(`${typeText}已删除`)
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || `删除${typeText}失败`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTriggerImport = () => {
    fileInputRef.current?.click()
  }

  const handleImportLocalFile = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) {
      return
    }

    const lyricFiles = isPv ? [] : files.filter(isLyricFile)
    const mediaFiles = isPv
      ? files.slice(0, 1)
      : files.filter((file) => !isLyricFile(file) && isAudioFile(file))

    if (isPv && mediaFiles.length === 0) {
      toast.error('请选择有效的视频文件')
      return
    }

    if (!isPv && mediaFiles.length === 0 && lyricFiles.length === 0) {
      toast.error('请选择音频或 .lrc 歌词文件')
      return
    }

    setIsSubmitting(true)
    try {
      if (isPv) {
        const file = mediaFiles[0]
        const imported = await importLocalGamePvById(gameId, file)
        await createGamePvById(gameId, {
          name: imported.name || getFileBaseName(file.name),
          url: imported.path,
        })

        await loadData()
        toast.success(`已导入本地${typeText}`)
        return
      }

      let importedAudioCount = 0
      for (const file of mediaFiles) {
        const imported = await importLocalGameOstById(gameId, file)
        await createGameOstById(gameId, {
          name: imported.name || getFileBaseName(file.name),
          url: imported.path,
        })
        importedAudioCount += 1
      }

      let uploadedLyricCount = 0
      if (lyricFiles.length > 0) {
        const latest = await getGameOstsById(gameId)
        setItems(latest.items)

        for (const lyric of lyricFiles) {
          const lyricKey = normalizeBaseName(getFileBaseName(lyric.name))
          const target = latest.items.find(
            (item) => normalizeBaseName(item.name) === lyricKey,
          )

          if (!target) {
            continue
          }

          await uploadGameOstLyricById(gameId, {
            itemId: target.id,
            file: lyric,
          })
          uploadedLyricCount += 1
        }
      }

      await loadData()
      toast.success(
        `OST 导入完成：音频 ${importedAudioCount} 个，歌词 ${uploadedLyricCount} 个`,
      )

      if (lyricFiles.length > uploadedLyricCount) {
        toast.warning('部分歌词未匹配到同名 OST，请检查文件名')
      }
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(
        err.response?.data?.error || err.message || `导入${typeText}失败`,
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept={isPv ? 'video/*' : 'audio/*,.lrc,text/plain'}
        multiple={!isPv}
        className="hidden"
        onChange={(event) => void handleImportLocalFile(event)}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto_2fr_auto_auto]">
        <Input
          placeholder={`${typeText}名称`}
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleTriggerImport}
        >
          <Upload className="size-4" />
          本地导入
        </Button>
        <Input
          placeholder={`${typeText}链接`}
          value={newUrl}
          onChange={(event) => setNewUrl(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={() => void handleAdd()}
        >
          添加
        </Button>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            className="pl-9"
            placeholder="关键词搜索"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />
        </div>
      </div>

      {editingId ? (
        <div className="space-y-2 rounded-md border p-3">
          <div className="text-sm font-medium">编辑{typeText}</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <Input
              placeholder={`${typeText}名称`}
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />
            <Input
              placeholder={`${typeText}链接`}
              value={editUrl}
              onChange={(event) => setEditUrl(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingId(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSaveEdit()}
            >
              保存修改
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-2 rounded-md border p-3">
        {isLoading ? (
          <div className="text-muted-foreground text-sm">加载中...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-muted-foreground text-sm">暂无{typeText}</div>
        ) : (
          currentItems.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-md border p-3"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <div className="font-medium">{item.name}</div>
                <a
                  className="text-muted-foreground block truncate text-sm hover:underline"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {item.url}
                </a>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartEdit(item)}
                >
                  <Pencil className="size-4" />
                  编辑
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setPendingDeleteItem(item)}
                >
                  <Trash2 className="size-4" />
                  删除
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          第 {currentPage} / {totalPages} 页，共 {filteredItems.length} 条
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            上一页
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            下一页
          </Button>
        </div>
      </div>

      <AlertDialog
        open={Boolean(pendingDeleteItem)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isSubmitting) {
            setPendingDeleteItem(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除{typeText}</AlertDialogTitle>
            <AlertDialogDescription>
              确认删除{typeText}「{pendingDeleteItem?.name || '-'}
              」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isSubmitting || !pendingDeleteItem}
              onClick={(event) => {
                event.preventDefault()
                if (!pendingDeleteItem) {
                  return
                }
                void handleDelete(pendingDeleteItem)
              }}
            >
              {isSubmitting ? '删除中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
