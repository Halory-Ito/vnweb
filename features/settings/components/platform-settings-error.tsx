import { Button } from '@/components/ui/button'

/** 平台配置或绑定账号加载失败时的错误提示与重试操作。 */
export function PlatformSettingsError({
  accountsError,
  platformError,
  isRetrying,
  onRetry,
}: {
  accountsError: boolean
  platformError: boolean
  isRetrying: boolean
  onRetry: () => void
}) {
  const message =
    accountsError && platformError
      ? '平台配置和绑定账号加载失败'
      : accountsError
        ? '绑定账号加载失败'
        : '平台配置加载失败'

  return (
    <div className="flex flex-wrap items-center gap-3">
      <p role="alert" className="text-destructive text-sm">
        {message}
      </p>
      <Button type="button" variant="outline" disabled={isRetrying} onClick={onRetry}>
        重试
      </Button>
    </div>
  )
}
