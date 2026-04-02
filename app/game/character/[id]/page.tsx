'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, ArrowLeft, SearchX } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { getVndbCharacterById, updateVndbCharacterById } from '@/lib/game-utils'

const formatBirthday = (birthday: [number, number] | null) => {
  if (!birthday) {
    return '-'
  }

  const [month, day] = birthday
  if (!month || !day) {
    return '-'
  }
  return `${month}月${day}日`
}

const formatSexOrGender = (
  value: [string | null, string | null] | null,
  map: Record<string, string>,
) => {
  if (!value) {
    return '-'
  }

  const [publicValue, spoilerValue] = value
  const publicText = publicValue ? map[publicValue] || publicValue : '-'
  const spoilerText = spoilerValue ? map[spoilerValue] || spoilerValue : '-'

  if (publicText === spoilerText) {
    return publicText
  }

  return `${publicText} / ${spoilerText}`
}

const infoRows = (
  data: Awaited<ReturnType<typeof getVndbCharacterById>>,
): Array<{ label: string; value: string }> => [
  {
    label: '本名',
    value: data.original || '-',
  },
  {
    label: '年龄',
    value: data.age === null ? '-' : String(data.age),
  },
  {
    label: '生日',
    value: formatBirthday(data.birthday),
  },
  {
    label: '血型',
    value: data.bloodType || '-',
  },
  {
    label: '身高',
    value: data.height === null ? '-' : `${data.height} cm`,
  },
  {
    label: '体重',
    value: data.weight === null ? '-' : `${data.weight} kg`,
  },
  {
    label: '三围',
    value:
      data.bust === null || data.waist === null || data.hips === null
        ? '-'
        : `${data.bust}/${data.waist}/${data.hips} cm`,
  },
  // {
  //   label: '罩杯',
  //   value: data.cup || '-',
  // },
  {
    label: '性别(外观/剧透)',
    value: formatSexOrGender(data.sex, {
      m: '男',
      f: '女',
      b: '双性',
      n: '无性',
    }),
  },
  // {
  //   label: '性认同(外观/剧透)',
  //   value: formatSexOrGender(data.gender, {
  //     m: '男',
  //     f: '女',
  //     o: '非二元',
  //     a: '未明确',
  //   }),
  // },
]

type CharacterDetailEmptyStateProps = {
  icon: typeof AlertCircle
  title: string
  description: string
  children?: React.ReactNode
}

function CharacterDetailEmptyState({
  icon: Icon,
  title,
  description,
  children,
}: CharacterDetailEmptyStateProps) {
  return (
    <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto">
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center p-4 md:p-6">
        <div className="bg-background/80 w-full max-w-xl rounded-2xl border px-6 py-10 text-center shadow-sm backdrop-blur-sm md:px-8">
          <div className="bg-muted text-muted-foreground mx-auto mb-4 flex size-14 items-center justify-center rounded-full border">
            <Icon className="size-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="text-muted-foreground text-sm leading-6">
              {description}
            </p>
          </div>
          {children ? (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function CharacterDetailSkeleton() {
  return (
    <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto p-4 md:p-6">
      <div className="mb-4">
        <Skeleton className="h-8 w-20" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-md border p-3">
          <Skeleton className="min-h-96 w-full rounded-md" />
        </div>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>

          <div className="rounded-md border p-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const queryClient = useQueryClient()
  const gameId = searchParams.get('gameId')
  const numericGameId = Number(gameId)
  const canEdit = Number.isInteger(numericGameId) && numericGameId > 0
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    original: '',
    imageUrl: '',
    bloodType: '',
    age: '',
    height: '',
    weight: '',
    bust: '',
    waist: '',
    hips: '',
    birthdayMonth: '',
    birthdayDay: '',
    sexPublic: '',
    sexSpoiler: '',
    genderPublic: '',
    genderSpoiler: '',
    description: '',
  })

  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ['vndb-character', params.id, numericGameId || 0],
    queryFn: () =>
      getVndbCharacterById(params.id, canEdit ? numericGameId : undefined),
    enabled: Boolean(params.id),
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setForm({
      name: data.name || '',
      original: data.original || '',
      imageUrl: data.imageUrl || '',
      bloodType: data.bloodType || '',
      age: data.age === null ? '' : String(data.age),
      height: data.height === null ? '' : String(data.height),
      weight: data.weight === null ? '' : String(data.weight),
      bust: data.bust === null ? '' : String(data.bust),
      waist: data.waist === null ? '' : String(data.waist),
      hips: data.hips === null ? '' : String(data.hips),
      birthdayMonth: data.birthday?.[0] ? String(data.birthday[0]) : '',
      birthdayDay: data.birthday?.[1] ? String(data.birthday[1]) : '',
      sexPublic: data.sex?.[0] || '',
      sexSpoiler: data.sex?.[1] || '',
      genderPublic: data.gender?.[0] || '',
      genderSpoiler: data.gender?.[1] || '',
      description: data.description || '',
    })
  }, [data])

  const backHref = gameId ? `/game/info/${gameId}` : '/game/home'

  const saveEdit = async () => {
    if (!canEdit) {
      toast.error('缺少 gameId，无法保存编辑')
      return
    }

    const toNullableNumber = (value: string) => {
      const trimmed = value.trim()
      if (!trimmed) {
        return null
      }
      const num = Number(trimmed)
      return Number.isFinite(num) ? Math.trunc(num) : null
    }

    setSaving(true)
    try {
      await updateVndbCharacterById(params.id, {
        gameId: numericGameId,
        name: form.name.trim(),
        original: form.original.trim(),
        imageUrl: form.imageUrl.trim(),
        bloodType: form.bloodType.trim(),
        age: toNullableNumber(form.age),
        height: toNullableNumber(form.height),
        weight: toNullableNumber(form.weight),
        bust: toNullableNumber(form.bust),
        waist: toNullableNumber(form.waist),
        hips: toNullableNumber(form.hips),
        birthday:
          form.birthdayMonth.trim() && form.birthdayDay.trim()
            ? [
                Number(form.birthdayMonth.trim()),
                Number(form.birthdayDay.trim()),
              ]
            : null,
        sex:
          form.sexPublic.trim() || form.sexSpoiler.trim()
            ? [form.sexPublic.trim() || null, form.sexSpoiler.trim() || null]
            : null,
        gender:
          form.genderPublic.trim() || form.genderSpoiler.trim()
            ? [
                form.genderPublic.trim() || null,
                form.genderSpoiler.trim() || null,
              ]
            : null,
        description: form.description,
      })

      await queryClient.invalidateQueries({
        queryKey: ['vndb-character', params.id, numericGameId || 0],
      })
      setEditing(false)
      toast.success('角色信息已保存')
    } catch (saveError) {
      const err = saveError as {
        response?: { data?: { error?: string } }
        message?: string
      }
      toast.error(err.response?.data?.error || err.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return <CharacterDetailSkeleton />
  }

  if (error) {
    return (
      <CharacterDetailEmptyState
        icon={AlertCircle}
        title="人物信息加载失败"
        description="当前无法读取人物资料，请稍后重试。"
      >
        <Button
          type="button"
          variant="outline"
          disabled={isRefetching}
          onClick={() => void refetch()}
        >
          {isRefetching ? '重试中...' : '重新加载'}
        </Button>
        <Button asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </CharacterDetailEmptyState>
    )
  }

  if (!data) {
    return (
      <CharacterDetailEmptyState
        icon={SearchX}
        title="未找到人物信息"
        description="这条角色记录可能不存在，或当前链接参数已失效。"
      >
        <Button asChild>
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </CharacterDetailEmptyState>
    )
  }

  return (
    <div className="mx-auto max-h-[calc(100vh-70px)] w-full overflow-y-auto p-4 md:p-6">
      <div className="mb-4">
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-md">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.name || data.original || data.id}
              className="h-auto w-full rounded-md object-cover transition-transform duration-400 hover:scale-105"
            />
          ) : (
            <div className="text-muted-foreground flex min-h-96 items-center justify-center rounded-md border text-sm">
              暂无图片
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-semibold">
                  {data.name || data.id}
                </div>
                {data.original && data.original !== data.name ? (
                  <div className="text-muted-foreground mt-1 text-sm">
                    {data.original}
                  </div>
                ) : null}
              </div>
              {canEdit ? (
                <div className="flex gap-2">
                  {editing ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                      >
                        取消
                      </Button>
                      <Button
                        type="button"
                        onClick={() => void saveEdit()}
                        disabled={saving}
                      >
                        {saving ? '保存中...' : '保存'}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" onClick={() => setEditing(true)}>
                      编辑
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {editing ? (
            <div className="rounded-md border p-4">
              <div className="mb-3 text-base font-medium">编辑角色信息</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  placeholder="姓名"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="本名"
                  value={form.original}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, original: e.target.value }))
                  }
                />
                <Input
                  placeholder="图片链接"
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                  }
                />
                <Input
                  placeholder="血型"
                  value={form.bloodType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bloodType: e.target.value }))
                  }
                />
                <Input
                  placeholder="年龄"
                  value={form.age}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, age: e.target.value }))
                  }
                />
                <Input
                  placeholder="身高"
                  value={form.height}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, height: e.target.value }))
                  }
                />
                <Input
                  placeholder="体重"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, weight: e.target.value }))
                  }
                />
                <Input
                  placeholder="胸围"
                  value={form.bust}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bust: e.target.value }))
                  }
                />
                <Input
                  placeholder="腰围"
                  value={form.waist}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, waist: e.target.value }))
                  }
                />
                <Input
                  placeholder="臀围"
                  value={form.hips}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, hips: e.target.value }))
                  }
                />
                <Input
                  placeholder="生日月"
                  value={form.birthdayMonth}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      birthdayMonth: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="生日日"
                  value={form.birthdayDay}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      birthdayDay: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="性别(公开) 例:m/f/b/n"
                  value={form.sexPublic}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sexPublic: e.target.value }))
                  }
                />
                <Input
                  placeholder="性别(剧透) 例:m/f/b/n"
                  value={form.sexSpoiler}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, sexSpoiler: e.target.value }))
                  }
                />
                <Input
                  placeholder="性认同(公开) 例:m/f/o/a"
                  value={form.genderPublic}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      genderPublic: e.target.value,
                    }))
                  }
                />
                <Input
                  placeholder="性认同(剧透) 例:m/f/o/a"
                  value={form.genderSpoiler}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      genderSpoiler: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="mt-3">
                <Textarea
                  placeholder="角色概述"
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={6}
                />
              </div>
            </div>
          ) : null}

          <div className="rounded-md border p-4">
            <div className="mb-3 text-base font-medium">基本信息</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {infoRows(data).map((row) => (
                <div
                  key={row.label}
                  className="space-y-1 rounded-md border p-3"
                >
                  <div className="text-muted-foreground text-xs">
                    {row.label}
                  </div>
                  <div className="text-sm">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border p-4">
            <div className="mb-3 text-base font-medium">概述</div>
            <div className="text-muted-foreground text-sm leading-6 whitespace-pre-wrap">
              {data.description || '暂无概述'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
