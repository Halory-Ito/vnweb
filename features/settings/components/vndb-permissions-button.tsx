import { useMutation } from '@tanstack/react-query'
import { LoaderCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { checkVndbTokenPermissions } from '@/lib/platform-account-utils'

const messages = {
  unbound: '请先绑定 VNDB Token。',
  invalid: 'VNDB Token 无效或与已绑定账号不匹配。',
  writable: 'Token 有 listwrite 权限，可以更新 VNDB 游玩清单。',
  'read-only': 'Token 缺少 listwrite 权限，无法更新 VNDB 游玩清单。',
}

export function VndbPermissionsButton() {
  const [open, setOpen] = useState(false)
  const check = useMutation({ mutationFn: checkVndbTokenPermissions })
  const label = '检查 VNDB Token 写入权限'

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) check.mutate()
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon-xs" aria-label={label} title={label}>
          {check.isPending ? (
            <LoaderCircle className="motion-safe:animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck aria-hidden="true" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label={label} className="max-w-[calc(100vw-2rem)] text-sm">
        <p role="status">
          {check.isPending
            ? '正在检查…'
            : check.isError
              ? '无法查询 VNDB 权限，请稍后重试。'
              : check.data && messages[check.data]}
        </p>
      </PopoverContent>
    </Popover>
  )
}
