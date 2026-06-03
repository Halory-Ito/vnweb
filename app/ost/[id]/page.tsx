'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { use, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { SongConvertDialog } from './_ui/song-convert-dialog'
import { SongDeleteDialog } from './_ui/song-delete-dialog'
import { SongFormDialog } from './_ui/song-form-dialog'
import { SongManageContent } from './_ui/song-manage-content'
import { SongSearchToolbar } from './_ui/song-search-toolbar'
import {
  createOstSong,
  deleteOstSong,
  getOstById,
  getOstSongs,
  updateOstSong,
  type OstSongItem,
} from '@/lib/game/game-utils'

export default function SongPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const ostId = Number(resolvedParams.id)
  const router = useRouter()
  const queryClient = useQueryClient()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [convertDialogOpen, setConvertDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<OstSongItem | null>(null)
  const [editingItem, setEditingItem] = useState<OstSongItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [keywordInput, setKeywordInput] = useState('')

  const { data: ostData } = useQuery({
    queryKey: ['ost-detail', ostId],
    queryFn: () => getOstById(ostId),
    enabled: !Number.isNaN(ostId) && ostId > 0,
  })

  const {
    data: songsData,
    isLoading,
    isRefetching,
  } = useQuery({
    queryKey: ['ost-songs', ostId],
    queryFn: () => getOstSongs(ostId),
    enabled: !Number.isNaN(ostId) && ostId > 0,
  })

  const filteredItems = useMemo(() => {
    return (songsData?.items ?? []).filter((item) => {
      if (keywordInput) {
        const kw = keywordInput.toLowerCase()
        return item.name.toLowerCase().includes(kw)
      }
      return true
    })
  }, [keywordInput, songsData?.items])

  const openCreateDialog = () => {
    setEditingItem(null)
    setDialogOpen(true)
  }

  const openEditDialog = (item: OstSongItem) => {
    setEditingItem(item)
    setDialogOpen(true)
  }

  const handleSearch = () => {
    // Handled in useMemo
  }

  const handleReset = () => {
    setKeywordInput('')
  }

  const handleSubmit = async (data: {
    name: string
    url: string
    mediaType?: string
    lyricsText?: string
    lyricsPath?: string
  }) => {
    if (!data.name.trim() || !data.url.trim()) {
      toast.error('歌曲名称和URL不能为空')
      return
    }

    if (!ostData?.item) {
      toast.error('OST 信息获取失败，无法保存歌曲')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingItem) {
        await updateOstSong(editingItem.id, {
          name: data.name.trim(),
          url: data.url.trim(),
          mediaType: data.mediaType?.trim() || '',
          lyricsText: data.lyricsText?.trim() || '',
          lyricsPath: data.lyricsPath?.trim() || '',
        })
        toast.success('歌曲已更新')
      } else {
        await createOstSong({
          gameId: ostData.item.gameId,
          ostId: ostId,
          name: data.name.trim(),
          url: data.url.trim(),
          mediaType: data.mediaType?.trim() || '',
          lyricsText: data.lyricsText?.trim() || '',
          lyricsPath: data.lyricsPath?.trim() || '',
        })
        toast.success('歌曲已添加')
      }

      setDialogOpen(false)
      setEditingItem(null)
      await queryClient.invalidateQueries({ queryKey: ['ost-songs', ostId] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存歌曲失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) {
      return
    }

    setIsSubmitting(true)
    try {
      await deleteOstSong(pendingDelete.id)
      toast.success('歌曲已删除')
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['ost-songs', ostId] })
    } catch (error) {
      const err = error as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '删除歌曲失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-h-[calc(100vh-70px)] w-full space-y-4 overflow-x-hidden overflow-y-scroll p-4">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="hover:bg-accent rounded-full p-2 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">
          {ostData?.item?.name
            ? `${ostData.item.name} - 歌曲列表`
            : '加载中...'}
        </h1>
      </div>

      <SongSearchToolbar
        keywordInput={keywordInput}
        onKeywordInputChange={setKeywordInput}
        onSearch={handleSearch}
        onReset={handleReset}
        onCreate={openCreateDialog}
        onConvert={() => setConvertDialogOpen(true)}
      />

      <SongManageContent
        items={filteredItems}
        isLoading={isLoading}
        isRefetching={isRefetching}
        onEdit={openEditDialog}
        onDelete={setPendingDelete}
        resource={ostData?.item?.resource}
      />

      <SongFormDialog
        open={dialogOpen}
        editingItem={editingItem}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setEditingItem(null)
          }
        }}
        onSubmit={handleSubmit}
      />

      <SongDeleteDialog
        item={pendingDelete}
        isSubmitting={isSubmitting}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
        onConfirm={handleDelete}
      />

      <SongConvertDialog
        open={convertDialogOpen}
        onOpenChange={setConvertDialogOpen}
        currentOstId={ostId}
        currentOstName={ostData?.item?.name || ''}
        currentSongs={songsData?.items || []}
        onConvertComplete={() => {
          void queryClient.invalidateQueries({ queryKey: ['ost-songs', ostId] })
        }}
      />
    </div>
  )
}
