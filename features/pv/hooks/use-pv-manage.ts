'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  EMPTY_PV_FILTERS,
  EMPTY_PV_METADATA,
  filterPvs,
  getPvCategories,
  getPvCategoryName,
  getPvFilterValue,
  PV_LIBRARY_FILTERS,
} from '../lib/pv-library'
import { readPvDuration } from '../lib/read-pv-duration'
import {
  createPvManageItem,
  deletePvManageItem,
  getGameCardList,
  getPvManageList,
  updatePvManageItem,
} from '@/api'
import { useDebounce } from '@/hooks/use-debounce'
import { callHook } from '@/lib/plugins'

import type { PvCategoryFilter, PvFilterKey, PvFilters } from '../lib/pv-library'
import type { PvFormState, PvItem } from '../types'

const PAGE_SIZE = 12
const EMPTY_ITEMS: PvItem[] = []
const DEFAULT_FORM: PvFormState = { gameId: '', name: '', url: '', metadata: EMPTY_PV_METADATA }

export function usePvManage() {
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<PvCategoryFilter>(null)
  const [filters, setFilters] = useState<PvFilters>(EMPTY_PV_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [creating, setCreating] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [editingPreview, setEditingPreview] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PvItem | null>(null)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { data: gameCards } = useQuery({
    queryKey: ['game-cards'],
    queryFn: () => getGameCardList(),
  })
  const query = useQuery({ queryKey: ['pv-manage'], queryFn: () => getPvManageList() })
  const allItems = query.data?.items ?? EMPTY_ITEMS
  const categories = useMemo(() => getPvCategories(allItems), [allItems])
  const activeCategory = category && !categories.includes(category) ? null : category
  const activeItem = allItems.find((item) => item.id === activeId) ?? null
  const search = useDebounce(keyword.trim().toLowerCase(), 250)

  const searched = useMemo(
    () =>
      search
        ? allItems.filter((item) =>
            [item.name, item.url, item.gameName, item.gameNameCn].some((value) =>
              value?.toLowerCase().includes(search),
            ),
          )
        : allItems,
    [allItems, search],
  )

  const filtered = useMemo(
    () => filterPvs(searched, activeCategory, filters),
    [searched, activeCategory, filters],
  )
  const categoryCounts = useMemo(() => {
    const byCategory: Record<string, number> = {}
    let uncategorized = 0
    for (const item of searched) {
      const name = getPvCategoryName(item.metadata?.category)
      if (name) {
        byCategory[name] = (byCategory[name] ?? 0) + 1
      } else {
        uncategorized += 1
      }
    }
    return { total: searched.length, uncategorized, byCategory }
  }, [searched])
  const activeFilterCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters])
  const filterOptions = useMemo(
    () =>
      Object.fromEntries(
        PV_LIBRARY_FILTERS.map(({ key }) => [
          key,
          [
            ...new Set(
              allItems
                .map((item) => getPvFilterValue(item, key))
                .filter((value): value is string => Boolean(value)),
            ),
          ].sort((left, right) =>
            key === 'year' ? right.localeCompare(left) : left.localeCompare(right, 'zh-CN'),
          ),
        ]),
      ) as Record<PvFilterKey, string[]>,
    [allItems],
  )
  const gameOptions = useMemo(
    () => gameCards?.map((game) => ({ id: String(game.id), label: game.title })) ?? [],
    [gameCards],
  )

  function updateKeyword(value: string) {
    setKeyword(value)
    setVisibleCount(PAGE_SIZE)
  }

  function updateCategory(value: PvCategoryFilter) {
    setCategory(value)
    setVisibleCount(PAGE_SIZE)
  }

  function updateFilter(key: PvFilterKey, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
    setVisibleCount(PAGE_SIZE)
  }

  function resetFilters() {
    setFilters(EMPTY_PV_FILTERS)
    setVisibleCount(PAGE_SIZE)
  }

  function openCreate() {
    setForm(DEFAULT_FORM)
    setCreating(true)
  }

  function openPreview(item: PvItem, startEditing = false) {
    setForm({
      gameId: String(item.gameId),
      name: item.name,
      url: item.url,
      metadata: {
        ...(item.metadata ?? EMPTY_PV_METADATA),
        category: getPvCategoryName(item.metadata?.category),
      },
    })
    setEditingPreview(startEditing)
    setActiveId(item.id)
  }

  async function updateUrl(url: string) {
    setForm((current) => ({ ...current, url }))
    if (!url.includes('b23.tv/') && !url.includes('bilibili.com')) return
    try {
      const result = await callHook('pv:resolve-url', { url })
      const resolvedUrl = result?.resolvedUrl
      if (resolvedUrl) {
        setForm((current) => (current.url === url ? { ...current, url: resolvedUrl } : current))
      }
    } catch {
      // Keep the entered URL if the plugin cannot resolve it.
    }
  }

  function fillDuration(duration: number) {
    setForm((current) =>
      current.url === activeItem?.url && !current.metadata.duration
        ? { ...current, metadata: { ...current.metadata, duration } }
        : current,
    )
  }

  function invalidatePvQueries() {
    return Promise.all(
      ['pv-manage', 'game-pvs', 'game'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
  }

  async function save(uploadedUrl?: string) {
    const gameId = Number(form.gameId)
    const name = form.name.trim()
    const url = uploadedUrl || form.url.trim()

    if (!Number.isInteger(gameId) || gameId <= 0) {
      toast.error('请选择游戏')
      return
    }
    if (!name || !url) {
      toast.error('PV 名称和链接不能为空')
      return
    }

    setIsSubmitting(true)
    try {
      const metadata =
        !activeItem && form.metadata.duration === null
          ? { ...form.metadata, duration: await readPvDuration(url) }
          : form.metadata
      const payload = { gameId, name, url, metadata }
      if (activeItem) {
        await updatePvManageItem(activeItem.id, payload)
        setActiveId(null)
      } else {
        await createPvManageItem(payload)
        setCreating(false)
      }
      await invalidatePvQueries()
      toast.success(activeItem ? 'PV 已更新' : 'PV 已创建')
    } catch (error) {
      const failure = error as { response?: { data?: { error?: string } } }
      toast.error(failure.response?.data?.error || '保存 PV 失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function remove() {
    if (!pendingDelete) return

    setIsSubmitting(true)
    try {
      await deletePvManageItem(pendingDelete.id)
      if (activeId === pendingDelete.id) setActiveId(null)
      setPendingDelete(null)
      await invalidatePvQueries()
      toast.success('PV 已删除')
    } catch (error) {
      const failure = error as { response?: { data?: { error?: string } } }
      toast.error(failure.response?.data?.error || '删除 PV 失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    keyword,
    category: activeCategory,
    categories,
    categoryCounts,
    filters,
    activeFilterCount,
    filterOptions,
    updateKeyword,
    updateCategory,
    updateFilter,
    resetFilters,
    items: filtered.slice(0, visibleCount),
    total: filtered.length,
    hasMore: visibleCount < filtered.length,
    loadMore: () => setVisibleCount((count) => count + PAGE_SIZE),
    query,
    activeItem,
    editingPreview,
    setEditingPreview,
    openPreview,
    closePreview: () => {
      setActiveId(null)
      setEditingPreview(false)
    },
    creating,
    openCreate,
    setCreating,
    form,
    setForm,
    gameOptions,
    isSubmitting,
    updateUrl,
    save,
    fillDuration,
    pendingDelete,
    setPendingDelete,
    remove,
  }
}
