'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Hls from 'hls.js'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  isPlayableLiveUrl,
  type LiveChannel,
  type LiveSource,
  parseM3U8Channels,
} from '../utils'
import { ChannelPanel } from './_ui/channel-panel'
import {
  type EditableSource,
  ManageSourcesDialog,
} from './_ui/manage-sources-dialog'
import { PlayerPanel } from './_ui/player-panel'
import {
  SourceFormDialog,
  type SourceFormValue,
} from './_ui/source-form-dialog'
import { SourcePanel } from './_ui/source-panel'
import { TopActions } from './_ui/top-actions'

const EMPTY_FORM_VALUE: SourceFormValue = {
  name: '',
  url: '',
  priority: '100',
  icon: '',
  valid: true,
  needProxy: true,
}

const LAST_PLAYBACK_STORAGE_KEY = 'vnweb:addon:cctv-4k:last-playback'

export default function Home() {
  const queryClient = useQueryClient()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const failedChannelIndexesRef = useRef<Set<number>>(new Set())

  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [createValue, setCreateValue] =
    useState<SourceFormValue>(EMPTY_FORM_VALUE)

  const [openEditDialog, setOpenEditDialog] = useState(false)

  const [activeSourceId, setActiveSourceId] = useState('')
  const [channels, setChannels] = useState<LiveChannel[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [channelKeywordInput, setChannelKeywordInput] = useState('')
  const [debouncedChannelKeyword, setDebouncedChannelKeyword] = useState('')
  const [onlyPlayable, setOnlyPlayable] = useState(true)
  const [lastChannelUrlBySource, setLastChannelUrlBySource] = useState<
    Record<string, string>
  >({})

  const { data: sources = [] } = useQuery<LiveSource[]>({
    queryKey: ['cctv-sources'],
    queryFn: async () => {
      const response = await fetch('/api/addOns/cctv-4k/sources')
      if (!response.ok) {
        throw new Error('Failed to fetch sources')
      }

      return response.json()
    },
  })

  const activeSource = useMemo(
    () => sources.find((item) => item.id === activeSourceId) ?? null,
    [activeSourceId, sources],
  )

  const activeChannel = channels[activeIndex]

  const channelIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const [index, channel] of channels.entries()) {
      map.set(channel.id, index)
    }

    return map
  }, [channels])

  const filteredChannels = useMemo(() => {
    return channels.filter((channel) => {
      const matchedKeyword =
        !debouncedChannelKeyword ||
        channel.name.toLowerCase().includes(debouncedChannelKeyword)
      const matchedPlayable = !onlyPlayable || isPlayableLiveUrl(channel.url)

      return matchedKeyword && matchedPlayable
    })
  }, [channels, debouncedChannelKeyword, onlyPlayable])

  const toProxyStreamUrl = (url: string) =>
    `/api/addOns/cctv-4k/stream?url=${encodeURIComponent(url)}`

  const createSourceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/addOns/cctv-4k/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createValue.name.trim(),
          url: createValue.url.trim(),
          priority: Number(createValue.priority) || 0,
          icon: createValue.icon.trim(),
          valid: createValue.valid,
          needProxy: createValue.needProxy,
        }),
      })

      if (!response.ok) {
        throw new Error('新增直播源失败')
      }

      return response.json() as Promise<{
        success: boolean
        source: LiveSource
      }>
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cctv-sources'] })
      setOpenCreateDialog(false)
      setCreateValue(EMPTY_FORM_VALUE)
    },
  })

  const updateSourceMutation = useMutation({
    mutationFn: async (payload: EditableSource) => {
      const response = await fetch('/api/addOns/cctv-4k/sources', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: payload.id,
          name: payload.name.trim(),
          url: payload.url.trim(),
          priority: Number(payload.priority) || 0,
          icon: payload.icon.trim(),
          valid: payload.valid,
          needProxy: payload.needProxy,
        }),
      })

      if (!response.ok) {
        throw new Error('编辑直播源失败')
      }

      return response.json() as Promise<{
        success: boolean
        source: LiveSource
      }>
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cctv-sources'] })
      setOpenEditDialog(false)
    },
  })

  const batchDeleteSourceMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const response = await fetch('/api/addOns/cctv-4k/sources', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      })

      if (!response.ok) {
        throw new Error('批量删除直播源失败')
      }

      return response.json() as Promise<{ success: boolean; ids: string[] }>
    },
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['cctv-sources'] })

      setLastChannelUrlBySource((prev) => {
        const next = { ...prev }
        for (const id of result.ids) {
          delete next[id]
        }
        return next
      })

      if (result.ids.includes(activeSourceId)) {
        setActiveSourceId('')
        setChannels([])
      }
    },
  })

  const loadChannels = async (source: LiveSource) => {
    if (!source.url.trim()) {
      setErrorMessage('当前直播源缺少可用链接。')
      setChannels([])
      return
    }

    setErrorMessage('')
    setChannelKeywordInput('')
    setDebouncedChannelKeyword('')

    try {
      const response = await fetch(source.url.trim())
      if (!response.ok) {
        throw new Error(`请求失败（${response.status}）`)
      }

      const content = await response.text()
      const parsed = parseM3U8Channels(content, source.url.trim())
      const playableChannels = parsed.filter((channel) =>
        isPlayableLiveUrl(channel.url),
      )

      if (playableChannels.length === 0) {
        throw new Error('未解析到可播放频道，请检查 m3u8 文件格式。')
      }

      failedChannelIndexesRef.current.clear()
      setChannels(playableChannels)
      const lastChannelUrl = lastChannelUrlBySource[source.id]
      const restoredIndex = playableChannels.findIndex(
        (channel) => channel.url === lastChannelUrl,
      )
      setActiveIndex(restoredIndex >= 0 ? restoredIndex : 0)
    } catch (error) {
      setChannels([])
      setErrorMessage(
        error instanceof Error ? error.message : '加载频道失败，请稍后重试。',
      )
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LAST_PLAYBACK_STORAGE_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as {
        sourceId?: string
        channelUrlBySource?: Record<string, string>
      }

      if (parsed.sourceId) {
        setActiveSourceId(parsed.sourceId)
      }

      if (
        parsed.channelUrlBySource &&
        typeof parsed.channelUrlBySource === 'object'
      ) {
        setLastChannelUrlBySource(parsed.channelUrlBySource)
      }
    } catch {
      // Ignore broken local storage payload.
    }
  }, [])

  useEffect(() => {
    if (!activeSourceId || !activeChannel?.id) {
      return
    }

    setLastChannelUrlBySource((prev) => ({
      ...prev,
      [activeSourceId]: activeChannel.url,
    }))
  }, [activeSourceId, activeChannel?.url])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        LAST_PLAYBACK_STORAGE_KEY,
        JSON.stringify({
          sourceId: activeSourceId,
          channelUrlBySource: lastChannelUrlBySource,
        }),
      )
    } catch {
      // Ignore write failures in private mode or restricted environments.
    }
  }, [activeSourceId, lastChannelUrlBySource])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedChannelKeyword(channelKeywordInput.trim().toLowerCase())
    }, 300)

    return () => {
      window.clearTimeout(timer)
    }
  }, [channelKeywordInput])

  useEffect(() => {
    if (!activeSourceId && sources.length > 0) {
      const preferred = sources.find((item) => item.valid) ?? sources[0]
      setActiveSourceId(preferred.id)
    }
  }, [activeSourceId, sources])

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!activeSource) {
      setChannels([])
      return
    }

    void loadChannels(activeSource)
  }, [activeSource])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeChannel?.url) {
      return
    }

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const sourceUrl = activeSource?.needProxy
      ? toProxyStreamUrl(activeChannel.url)
      : activeChannel.url

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl
      void video.play().catch(() => undefined)
      return
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
      })

      hlsRef.current = hls
      hls.loadSource(sourceUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setErrorMessage('')
        void video.play().catch(() => undefined)
      })
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          const failedSet = failedChannelIndexesRef.current
          failedSet.add(activeIndex)

          const nextIndex = channels.findIndex(
            (_, index) => !failedSet.has(index),
          )

          if (nextIndex >= 0 && nextIndex !== activeIndex) {
            setErrorMessage(
              `频道“${activeChannel.name}”播放失败，正在自动切换下一个可用频道。`,
            )
            setActiveIndex(nextIndex)
            return
          }

          setErrorMessage(
            '播放出现错误，所有频道均不可用或当前网络无法访问这些源。',
          )
        }
      })

      return
    }

    setErrorMessage('当前浏览器不支持 HLS 播放。')
  }, [activeChannel, activeIndex, channels, activeSource])

  const hasChannels = channels.length > 0
  const totalLabel = useMemo(
    () => `共 ${channels.length} 个频道`,
    [channels.length],
  )

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
      <TopActions
        onOpenCreate={() => setOpenCreateDialog(true)}
        onOpenManage={() => setOpenEditDialog(true)}
        hasSources={sources.length > 0}
      />

      {errorMessage && (
        <div className="rounded-md border border-red-500/35 bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[280px_1fr_340px]">
        <SourcePanel
          sources={sources}
          activeSourceId={activeSourceId}
          onSelect={setActiveSourceId}
        />

        <PlayerPanel
          videoRef={videoRef}
          activeChannel={activeChannel}
          hasChannels={hasChannels}
          totalLabel={totalLabel}
        />

        <ChannelPanel
          totalLabel={totalLabel}
          showSearch={showSearch}
          channelKeywordInput={channelKeywordInput}
          onlyPlayable={onlyPlayable}
          filteredChannels={filteredChannels}
          hasChannels={hasChannels}
          activeIndex={activeIndex}
          onToggleSearch={() => setShowSearch((prev) => !prev)}
          onChangeKeyword={setChannelKeywordInput}
          onToggleOnlyPlayable={setOnlyPlayable}
          onSelectChannel={setActiveIndex}
          getOriginalIndex={(channel) => channelIndexMap.get(channel.id) ?? -1}
        />
      </div>

      <SourceFormDialog
        open={openCreateDialog}
        onOpenChange={setOpenCreateDialog}
        title="新增直播源"
        description="填写直播源信息后会保存到 source.json 中。"
        submitLabel="保存直播源"
        isPending={createSourceMutation.isPending}
        value={createValue}
        onChange={setCreateValue}
        onSubmit={() => createSourceMutation.mutate()}
      />

      <ManageSourcesDialog
        open={openEditDialog}
        onOpenChange={setOpenEditDialog}
        sources={sources}
        isUpdating={updateSourceMutation.isPending}
        isBatchDeleting={batchDeleteSourceMutation.isPending}
        onUpdate={(value) => {
          updateSourceMutation.mutate(value)
        }}
        onBatchDelete={(ids) => batchDeleteSourceMutation.mutate(ids)}
      />
    </div>
  )
}
