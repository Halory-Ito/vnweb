import { useId } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import type { useGameLibraryImport } from '../../hooks/use-game-library-import'

export function GameLibraryImportAccount({
  state,
}: {
  state: ReturnType<typeof useGameLibraryImport>
}) {
  const uidInputId = useId()
  const { provider, label, account, isSearching, isImporting, isLoadingAccounts, isAccountsError } =
    state

  if (provider === 'steam') {
    return (
      <div className="space-y-2">
        <Label htmlFor={uidInputId}>Steam UID</Label>
        {account ? (
          <div className="text-muted-foreground text-xs">
            已绑定 Steam 账号：{account.accountId}
          </div>
        ) : null}
        <div className="flex items-center gap-2">
          <Input
            id={uidInputId}
            className="min-w-0"
            inputMode="numeric"
            autoComplete="off"
            placeholder="例如：7656119xxxxxxxxxx"
            value={state.steamUid}
            onChange={(event) => state.setSteamUid(event.target.value)}
            disabled={isSearching || isImporting}
          />
          <Button
            type="button"
            variant="outline"
            disabled={isSearching || isImporting || !state.steamUid.trim()}
            onClick={state.handleSearch}
          >
            {isSearching ? '搜索中...' : '搜索'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">已绑定账号</div>
      {isLoadingAccounts ? (
        <div className="text-muted-foreground text-sm">账号加载中...</div>
      ) : isAccountsError ? (
        <div className="text-muted-foreground rounded-md border p-3 text-sm">
          账号加载失败，请稍后重试。
        </div>
      ) : account ? (
        <div className="rounded-md border p-3 text-sm">
          <div className="font-medium">{account.profile?.displayName || account.accountId}</div>
          <div className="text-muted-foreground text-xs">账号 ID：{account.accountId}</div>
        </div>
      ) : (
        <div className="text-muted-foreground rounded-md border p-3 text-sm">
          请先在设置页绑定 {label} 账号。
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        disabled={isSearching || isImporting || !account}
        onClick={state.handleSearch}
      >
        {isSearching ? '读取中...' : '读取已绑定账号列表'}
      </Button>
    </div>
  )
}
