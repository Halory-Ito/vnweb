'use client'

import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { getVndbCharacterById } from '@/lib/game-utils'

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
  {
    label: '罩杯',
    value: data.cup || '-',
  },
  {
    label: '性别(外观/剧透)',
    value: formatSexOrGender(data.sex, {
      m: '男',
      f: '女',
      b: '双性',
      n: '无性',
    }),
  },
  {
    label: '性认同(外观/剧透)',
    value: formatSexOrGender(data.gender, {
      m: '男',
      f: '女',
      o: '非二元',
      a: '未明确',
    }),
  },
]

export default function CharacterDetailPage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId')

  const { data, isLoading, error } = useQuery({
    queryKey: ['vndb-character', params.id],
    queryFn: () => getVndbCharacterById(params.id),
    enabled: Boolean(params.id),
  })

  const backHref = gameId ? `/game/info/${gameId}` : '/game/home'

  if (isLoading) {
    return <div className="text-muted-foreground p-6 text-sm">加载中...</div>
  }

  if (error || !data) {
    return (
      <div className="space-y-4 p-6">
        <Button asChild variant="outline" size="sm">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            返回
          </Link>
        </Button>
        <div className="text-destructive text-sm">人物信息加载失败</div>
      </div>
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
        <div className="rounded-md border p-3">
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt={data.name || data.original || data.id}
              className="h-auto w-full rounded-md object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex min-h-96 items-center justify-center rounded-md border text-sm">
              暂无图片
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-md border p-4">
            <div className="text-xl font-semibold">{data.name || data.id}</div>
            {data.original && data.original !== data.name ? (
              <div className="text-muted-foreground mt-1 text-sm">
                {data.original}
              </div>
            ) : null}
          </div>

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
