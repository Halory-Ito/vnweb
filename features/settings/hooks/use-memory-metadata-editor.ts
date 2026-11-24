'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { saveMemoryMetadataSettingsApi } from '@/api'
import {
  MEMORY_METADATA_SETTINGS_QUERY_KEY,
  useMemoryMetadataSettings,
} from '@/hooks/use-memory-metadata-settings'
import {
  DEFAULT_MEMORY_METADATA_FIELDS,
  type MemoryMetadataFieldConfig,
  RESERVED_MEMORY_METADATA_KEYS,
} from '@/lib/settings/memory-metadata-settings'

export function useMemoryMetadataEditor() {
  const queryClient = useQueryClient()
  const { fields: serverFields, playback: serverPlayback, isLoading } = useMemoryMetadataSettings()
  const [draftFields, setDraftFields] = useState<MemoryMetadataFieldConfig[] | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fields = draftFields ?? serverFields

  const addField = () => {
    setDraftFields((prev) => [
      ...(prev ?? serverFields),
      {
        key: '',
        label: '',
        icon: 'hash',
        placeholder: '',
        enabled: true,
        builtin: false,
      },
    ])
  }

  const updateField = (index: number, patch: Partial<MemoryMetadataFieldConfig>) => {
    setDraftFields((prev) =>
      (prev ?? serverFields).map((field, currentIndex) =>
        currentIndex === index ? { ...field, ...patch } : field,
      ),
    )
  }

  const removeField = (index: number) => {
    setDraftFields((prev) => {
      const base = prev ?? serverFields
      if (base[index]?.builtin) {
        return base
      }
      return base.filter((_, currentIndex) => currentIndex !== index)
    })
  }

  const persistFields = async (nextFields: MemoryMetadataFieldConfig[], successText: string) => {
    setIsSaving(true)
    try {
      const saved = await saveMemoryMetadataSettingsApi(nextFields)
      queryClient.setQueryData(MEMORY_METADATA_SETTINGS_QUERY_KEY, {
        fields: saved,
        playback: serverPlayback,
      })
      setDraftFields(null)
      toast.success(successText)
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } }; message?: string }
      toast.error(err.response?.data?.error || err.message || '保存回忆设置失败')
    } finally {
      setIsSaving(false)
    }
  }

  const resetToDefault = async () => {
    const defaults = DEFAULT_MEMORY_METADATA_FIELDS.map((field) => ({ ...field }))
    await persistFields(defaults, '已恢复默认回忆元数据设置')
  }

  const save = async () => {
    const seenKeys = new Set<string>()
    for (const field of fields) {
      const label = field.label.trim()
      const key = field.key.trim()
      if (!label || !key) {
        toast.error('请填写完整的显示名称和 Frontmatter 键名')
        return
      }
      if (/[:\r\n]/.test(key)) {
        toast.error(`键名「${key}」不能包含冒号或换行符`)
        return
      }
      const lowerKey = key.toLowerCase()
      if (RESERVED_MEMORY_METADATA_KEYS.has(lowerKey)) {
        toast.error(`键名「${key}」为系统保留字段，请更换其他名称`)
        return
      }
      if (seenKeys.has(lowerKey)) {
        toast.error(`存在重复的键名「${key}」`)
        return
      }
      seenKeys.add(lowerKey)
    }

    await persistFields(fields, '回忆元数据设置已保存')
  }

  return {
    fields,
    isLoading,
    isSaving,
    hasChanges: draftFields !== null,
    addField,
    updateField,
    removeField,
    resetToDefault,
    save,
  }
}
