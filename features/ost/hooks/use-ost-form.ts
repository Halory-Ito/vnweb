'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getAlbumDetails, type OstService } from '../lib/ost-utils'
import { METING_ID_PATTERN } from '../meting-types'
import { searchOstAlbumsPage } from '../ost-api'
import { DEFAULT_OST_SEARCH_PAGE_SIZE, type OstSearchSession } from './use-ost-search-results'
import { getGameCardList } from '@/api'
import { useEnabledPlatforms } from '@/hooks/use-enabled-platforms'

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

const OST_SERVICE_OPTIONS: ReadonlyArray<{
  value: OstService
  label: string
  platformKey: 'enhanced' | 'meting'
}> = [
  { value: 'enhanced-api', label: 'Enhanced API', platformKey: 'enhanced' },
  { value: 'meting-api', label: 'Meting SDK', platformKey: 'meting' },
]

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
  const { isPlatformEnabled } = useEnabledPlatforms()
  const [form, setForm] = useState(emptyForm)
  const [service, setService] = useState<OstService>('enhanced-api')
  const availableServices = OST_SERVICE_OPTIONS.filter((option) =>
    isPlatformEnabled(option.platformKey, 'music-service'),
  )
  const activeService: OstService | '' = availableServices.some((item) => item.value === service)
    ? service
    : (availableServices[0]?.value ?? '')
  const [server, setServer] = useState<MetingServer>('netease')
  const [mode, setMode] = useState<'search' | 'album'>('search')
  const [searchSession, setSearchSession] = useState<OstSearchSession | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [albums, setAlbums] = useState<UnifiedAlbumDetails[]>([])
  const version = useRef(0)
  const searchSessionId = useRef(0)
  const { data: gameCards = [] } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
    enabled: open,
  })

  const resetResults = () => {
    version.current++
    setAlbums([])
    setSearchSession(null)
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
    setService('enhanced-api')
    setServer('netease')
    setMode('search')
    setAlbums([])
    setSearchSession(null)
    setShowResults(false)
  }, [open, editingItem])

  const keyword = form.searchKeyword.trim()
  const ids = mode === 'album' ? parseOstAlbumIds(keyword) : []
  const idPattern = activeService === 'meting-api' ? METING_ID_PATTERN : validId
  const hasInvalidIds = ids.some((id) => !idPattern.test(id))
  const canSearch =
    Boolean(activeService) &&
    (mode === 'search'
      ? keyword.length > 0 && keyword.length <= 200
      : ids.length > 0 && !hasInvalidIds)

  const loadAlbums = useMutation({
    mutationFn: async (
      references: Array<{ id: string; label: string; name?: string; cover?: string }>,
    ) => {
      if (!activeService) return
      const current = ++version.current
      setShowResults(false)
      setAlbums([])
      const loaded: UnifiedAlbumDetails[] = []
      const failed: string[] = []
      for (const { id, label, name, cover } of references) {
        if (current !== version.current) return
        try {
          const details = await getAlbumDetails(activeService, id)
          if (!details.songs.length) throw new Error('专辑没有曲目')
          loaded.push({ ...details, name: name || details.name, cover: cover || details.cover })
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
      const targetKeyword = keyword
      setAlbums([])
      setSearchSession(null)
      try {
        const result = await searchOstAlbumsPage(targetKeyword, {
          page: 1,
          pageSize: DEFAULT_OST_SEARCH_PAGE_SIZE,
        })
        if (current !== version.current) return
        if (result.items.length > 0) {
          setSearchSession({
            id: ++searchSessionId.current,
            keyword: targetKeyword,
            initialPage: result,
            fetchedAt: Date.now(),
          })
          setShowResults(true)
        } else {
          toast.info('未找到相关专辑')
        }
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
      selected.map(({ id, name, cover }) => ({ id: String(id), label: name, name, cover })),
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
        albums: albums.map(({ name, cover, source, songs }) => ({
          name: name.trim(),
          cover: cover.trim(),
          resource: source,
          songs,
        })),
      })
    }
  }

  return {
    form,
    setForm,
    availableServices,
    service: activeService,
    setService,
    server,
    setServer,
    mode,
    setMode,
    searchSession,
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
