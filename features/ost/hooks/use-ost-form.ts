'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getAlbumDetails, searchAlbums } from '../lib/ost-utils'
import { getGameCardList } from '@/api'

import type { MetingServer } from '../meting-types'
import type { UnifiedAlbumDetails, UnifiedSearchResult } from '../types'
import type { OstCreateAlbum } from '@/types/ost'

export type OstFormSubmission =
  | { gameId: number; name: string; cover: string }
  | { gameId: number; albums: OstCreateAlbum[] }

export type OstFormDialogProps = {
  open: boolean
  editingItem: { id: number; gameId: number; name: string; cover?: string } | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: OstFormSubmission) => void
}

const emptyForm = { gameId: '', name: '', cover: '', searchKeyword: '' }
const validId = /^\d{1,30}$/

export function parseOstAlbumIds(input: string) {
  return [
    ...new Set(
      input
        .split(/[,，]/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  ]
}

export function useOstForm({ open, editingItem, onSubmit }: OstFormDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [server, setServer] = useState<MetingServer>('netease')
  const [mode, setMode] = useState<'search' | 'album'>('search')
  const [searchResults, setSearchResults] = useState<UnifiedSearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [albums, setAlbums] = useState<UnifiedAlbumDetails[]>([])
  const version = useRef(0)
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
    enabled: open,
  })

  const resetResults = () => {
    version.current++
    setAlbums([])
    setSearchResults([])
    setShowResults(false)
  }

  useEffect(() => {
    version.current++
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
    setAlbums([])
    setSearchResults([])
    setShowResults(false)
  }, [open, editingItem])

  const keyword = form.searchKeyword.trim()
  const ids = mode === 'album' ? parseOstAlbumIds(keyword) : []
  const hasInvalidIds = ids.some((id) => !validId.test(id))
  const canSearch =
    mode === 'search'
      ? keyword.length > 0 && keyword.length <= 200
      : ids.length > 0 && !hasInvalidIds

  const loadAlbums = useMutation({
    mutationFn: async (references: Array<{ id: string; label: string; cover?: string }>) => {
      const current = ++version.current
      setShowResults(false)
      setAlbums([])
      const loaded: UnifiedAlbumDetails[] = []
      const failed: string[] = []
      for (const { id, label, cover } of references) {
        if (current !== version.current) return
        try {
          const details = await getAlbumDetails('meting-api', id)
          if (!details.songs.length) throw new Error('专辑没有曲目')
          loaded.push({ ...details, cover: details.cover || cover || '' })
        } catch {
          failed.push(label)
        }
      }
      if (current !== version.current) return
      setAlbums(loaded)
      if (failed.length) {
        toast.error(`${failed.length} 张专辑读取失败`, { description: failed.join('、') })
      }
    },
  })

  const search = useMutation({
    mutationFn: async () => {
      const current = ++version.current
      setAlbums([])
      setSearchResults([])
      try {
        const results = (await searchAlbums(keyword, 'meting-api')).filter(
          (album) => album.type === 'album',
        )
        if (current !== version.current) return
        setSearchResults(results)
        setShowResults(results.length > 0)
        if (!results.length) toast.info('未找到相关专辑')
      } catch {
        if (current === version.current) toast.error('搜索失败，请稍后重试')
      }
    },
  })

  const isBusy = search.isPending || loadAlbums.isPending
  const isValid =
    Number(form.gameId) > 0 &&
    (editingItem
      ? !!form.name.trim() && !!form.cover.trim()
      : albums.length > 0 && albums.every(({ name, cover }) => !!name.trim() && !!cover.trim()))

  const runSearch = () => {
    if (!canSearch || isBusy) return
    if (mode === 'search') search.mutate()
    else loadAlbums.mutate(ids.map((id) => ({ id: `${server}:album:${id}`, label: id })))
  }

  const changeSearchInput = (value: string) => {
    if (mode === 'album' && albums.length) resetResults()
    setForm((previous) => ({ ...previous, searchKeyword: value }))
  }

  const selectAlbums = (selected: UnifiedSearchResult[]) =>
    loadAlbums.mutate(
      selected.map(({ id, name, cover }) => ({ id: String(id), label: name, cover })),
    )

  const updateAlbum = (
    index: number,
    patch: Partial<Pick<UnifiedAlbumDetails, 'name' | 'cover'>>,
  ) =>
    setAlbums((previous) =>
      previous.map((album, position) => (index === position ? { ...album, ...patch } : album)),
    )

  const submit = () => {
    if (!isValid || isBusy) return
    const gameId = Number(form.gameId)
    if (editingItem) {
      onSubmit({ gameId, name: form.name.trim(), cover: form.cover.trim() })
    } else {
      onSubmit({
        gameId,
        albums: albums.map(({ name, cover, songs }) => ({
          name: name.trim(),
          cover: cover.trim(),
          resource: 'meting-api',
          songs,
        })),
      })
    }
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
    albums,
    updateAlbum,
    resetResults,
    gameCards,
    ids,
    hasInvalidIds,
    canSearch,
    changeSearchInput,
    runSearch,
    selectAlbums,
    isBusy,
    isValid,
    submit,
  }
}
