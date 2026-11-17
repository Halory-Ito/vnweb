'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getAlbumDetails, searchAlbums } from '../lib/ost-utils'
import { getGameCardList } from '@/api'

import type { MetingServer } from '../meting-types'
import type { UnifiedAlbumDetails, UnifiedSearchResult } from '../types'

export type OstFormDialogProps = {
  open: boolean
  editingItem: { id: number; gameId: number; name: string; cover?: string } | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: {
    gameId: number
    name: string
    cover: string
    resource?: string
    songs?: UnifiedAlbumDetails['songs']
  }) => void
}
const emptyForm = { gameId: '', name: '', cover: '', searchKeyword: '' }
export function useOstForm({ open, editingItem, onSubmit }: OstFormDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [server, setServer] = useState<MetingServer>('netease')
  const [mode, setMode] = useState<'search' | 'album'>('search')
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [albumDetails, setAlbumDetails] = useState<UnifiedAlbumDetails | null>(null)
  const version = useRef(0)
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
    enabled: open,
  })
  const resetResults = () => {
    version.current++
    setAlbumDetails(null)
    setSearchResults([])
    setShowResults(false)
  }
  useEffect(() => {
    version.current++
    if (open) {
      setForm(
        editingItem
          ? {
              ...emptyForm,
              gameId: String(editingItem.gameId),
              name: editingItem.name,
              cover: editingItem.cover || '',
            }
          : emptyForm,
      )
      setServer('netease')
      setMode('search')
      setAlbumDetails(null)
      setSearchResults([])
      setShowResults(false)
    }
  }, [open, editingItem])
  const applyDetails = (details: UnifiedAlbumDetails) => {
    setAlbumDetails(details)
    setForm((prev) => ({ ...prev, name: details.name, cover: details.cover }))
  }
  const search = useMutation({
    mutationFn: async () => {
      const current = ++version.current
      setAlbumDetails(null)
      setSearchResults([])
      try {
        if (mode !== 'search') {
          const details = await getAlbumDetails(
            'meting-api',
            `${server}:album:${form.searchKeyword.trim()}`,
          )
          if (current === version.current) applyDetails(details)
          return
        }
        const results = await searchAlbums(form.searchKeyword.trim(), 'meting-api')
        if (current !== version.current) return
        setSearchResults(results)
        setShowResults(results.length > 0)
        if (!results.length) toast.info('未找到相关专辑')
      } catch (error) {
        if (current === version.current) throw error
      }
    },
    onError: () => toast.error('读取失败，请检查输入或稍后重试'),
  })
  const select = useMutation({
    mutationFn: async (album: UnifiedSearchResult) => {
      if (album.type !== 'album') throw new Error('请选择专辑')
      const current = ++version.current
      setShowResults(false)
      try {
        const details = await getAlbumDetails(album.source, album.id)
        if (current === version.current)
          applyDetails({ ...details, cover: details.cover || album.cover })
      } catch (error) {
        if (current === version.current) throw error
      }
    },
    onError: () => toast.error('获取 OST 信息失败'),
  })
  const isBusy = search.isPending || select.isPending
  const isValid =
    !!form.gameId &&
    !!form.name.trim() &&
    !!form.cover.trim() &&
    (!!editingItem || !!albumDetails?.songs.length)
  const submit = () => {
    if (!isValid || isBusy) return
    onSubmit({
      gameId: Number(form.gameId),
      name: form.name.trim(),
      cover: form.cover.trim(),
      ...(editingItem ? {} : { resource: 'meting-api', songs: albumDetails?.songs }),
    })
  }
  return {
    form,
    setForm,
    server,
    setServer,
    mode,
    setMode,
    searchResults,
    showResults,
    setShowResults,
    albumDetails,
    resetResults,
    gameCards,
    search,
    select,
    isBusy,
    isValid,
    submit,
  }
}
