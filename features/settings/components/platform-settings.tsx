'use client'

import { useQuery } from '@tanstack/react-query'

import { usePlatformAccounts } from '../hooks/use-platform-accounts'
import { usePlatformVisibility } from '../hooks/use-platform-visibility'
import { PLATFORM_CONFIG_FIELDS } from '../lib/platform-config-fields'
import { EnhancedPlatformSection } from './enhanced-platform-section'
import { MetingPlatformSection } from './meting-platform-section'
import { providerConfig } from './platform-account-config'
import { PlatformAccountSection } from './platform-account-section'
import { PlatformConfigFields } from './platform-config-fields'
import { PlatformStatusMappings } from './platform-status-mappings'
import { PlatformVisibilityGrid } from './platform-visibility-grid'
import { Button } from '@/components/ui/button'
import { getPlatformSettingsApi } from '@/lib/settings/platform-settings'

import type { PlatformVisibilityKey } from '@/lib/settings/platform-visibility'

export default function PlatformSettings() {
  const {
    accountsQuery,
    accountMap,
    processingProvider,
    steamUid,
    setSteamUid,
    vndbToken,
    setVndbToken,
    ymgalUserId,
    setYmgalUserId,
    startOAuthLogin,
    handleBind,
    handleUnlink,
    handleSyncSteamPlaytime,
  } = usePlatformAccounts()
  const { isLoading } = accountsQuery
  const { query: visibility, save } = usePlatformVisibility()
  const isVisible = (key: PlatformVisibilityKey) =>
    visibility.data?.[key] ?? (key === 'meting' || key === 'enhanced' || accountMap.has(key))
  const platformQuery = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettingsApi,
  })
  const { data: platformSettings, isLoading: isLoadingPlatformSettings } = platformQuery

  if (accountsQuery.isLoadingError || platformQuery.isLoadingError) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <p role="alert" className="text-destructive text-sm">
          {accountsQuery.isLoadingError && platformQuery.isLoadingError
            ? '平台配置和绑定账号加载失败'
            : accountsQuery.isLoadingError
              ? '绑定账号加载失败'
              : '平台配置加载失败'}
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={accountsQuery.isFetching || platformQuery.isFetching}
          onClick={() => {
            if (accountsQuery.isLoadingError) void accountsQuery.refetch()
            if (platformQuery.isLoadingError) void platformQuery.refetch()
          }}
        >
          重试
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PlatformVisibilityGrid
        isVisible={isVisible}
        onChange={(platform, visible) => save.mutate({ platform, visible })}
        disabled={!visibility.data || isLoading || save.isPending}
      />
      {visibility.isLoadingError && (
        <Button type="button" variant="outline" onClick={() => void visibility.refetch()}>
          重试加载平台显示设置
        </Button>
      )}
      {visibility.data && isVisible('steam') && (
        <PlatformAccountSection
          provider="steam"
          config={providerConfig.steam}
          account={accountMap.get('steam')}
          isLoading={isLoading}
          isProcessing={processingProvider === 'steam'}
          onBind={() => void handleBind('steam')}
          onUnlink={() => void handleUnlink('steam')}
          onOAuthLogin={() => startOAuthLogin('steam')}
          onSyncPlaytime={() => void handleSyncSteamPlaytime()}
          inputValue={steamUid}
          onInputChange={setSteamUid}
        >
          <PlatformConfigFields
            platform="steam"
            fields={PLATFORM_CONFIG_FIELDS.steam}
            values={platformSettings?.steam}
            isLoading={isLoadingPlatformSettings}
          />
        </PlatformAccountSection>
      )}
      {visibility.data && isVisible('bangumi') && (
        <PlatformAccountSection
          provider="bangumi"
          config={providerConfig.bangumi}
          account={accountMap.get('bangumi')}
          isLoading={isLoading}
          isProcessing={processingProvider === 'bangumi'}
          onBind={() => {}}
          onUnlink={() => void handleUnlink('bangumi')}
          onOAuthLogin={() => startOAuthLogin('bangumi')}
          inputValue=""
          onInputChange={() => {}}
          onBindDisabled
        >
          <PlatformConfigFields
            platform="bangumi"
            fields={PLATFORM_CONFIG_FIELDS.bangumi}
            values={platformSettings?.bangumi}
            isLoading={isLoadingPlatformSettings}
          />
          <div className="mt-4 border-t pt-4">
            <PlatformStatusMappings provider="bangumi" />
          </div>
        </PlatformAccountSection>
      )}
      {visibility.data && isVisible('vndb') && (
        <PlatformAccountSection
          provider="vndb"
          config={providerConfig.vndb}
          account={accountMap.get('vndb')}
          isLoading={isLoading}
          isProcessing={processingProvider === 'vndb'}
          onBind={() => void handleBind('vndb')}
          onUnlink={() => void handleUnlink('vndb')}
          inputValue={vndbToken}
          onInputChange={setVndbToken}
          inputType="password"
        >
          <PlatformStatusMappings provider="vndb" />
        </PlatformAccountSection>
      )}
      {visibility.data && isVisible('ymgal') && (
        <PlatformAccountSection
          provider="ymgal"
          config={providerConfig.ymgal}
          account={accountMap.get('ymgal')}
          isLoading={isLoading}
          isProcessing={processingProvider === 'ymgal'}
          onBind={() => void handleBind('ymgal')}
          onUnlink={() => void handleUnlink('ymgal')}
          inputValue={ymgalUserId}
          onInputChange={setYmgalUserId}
        >
          <PlatformConfigFields
            platform="ymgal"
            fields={PLATFORM_CONFIG_FIELDS.ymgal}
            values={platformSettings?.ymgal}
            isLoading={isLoadingPlatformSettings}
          />
        </PlatformAccountSection>
      )}

      {visibility.data && isVisible('meting') && (
        <MetingPlatformSection
          values={platformSettings?.meting}
          isLoading={isLoadingPlatformSettings}
        />
      )}

      {visibility.data && isVisible('enhanced') && (
        <EnhancedPlatformSection
          values={platformSettings?.enhanced}
          isLoading={isLoadingPlatformSettings}
        />
      )}
    </div>
  )
}
