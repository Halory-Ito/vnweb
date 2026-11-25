'use client'

import { useQuery } from '@tanstack/react-query'

import { usePlatformAccounts } from '../hooks/use-platform-accounts'
import { usePlatformVisibility } from '../hooks/use-platform-visibility'
import { IMAGE_PLATFORM_SECTIONS, PLATFORM_CONFIG_FIELDS } from '../lib/platform-config-fields'
import { EnhancedPlatformSection } from './enhanced-platform-section'
import { ImagePlatformSection } from './image-platform-section'
import { MetingPlatformSection } from './meting-platform-section'
import { providerConfig, resolveBangumiProviderConfig } from './platform-account-config'
import { PlatformAccountSection } from './platform-account-section'
import { PlatformConfigFields } from './platform-config-fields'
import { PlatformSettingsError } from './platform-settings-error'
import { PlatformStatusMappings } from './platform-status-mappings'
import { PlatformVisibilityGrid } from './platform-visibility-grid'
import { Button } from '@/components/ui/button'
import { getPlatformSettingsApi } from '@/lib/settings/platform-settings'
import {
  isPlatformConfigVisible,
  isPlatformFeatureEnabled,
  type PlatformFeatureCategory,
  type PlatformVisibilityKey,
} from '@/lib/settings/platform-visibility'

export default function PlatformSettings() {
  const {
    accountsQuery,
    accountMap,
    processingProvider,
    steamUid,
    setSteamUid,
    bangumiToken,
    setBangumiToken,
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
  const hasBoundAccount = (provider: 'steam' | 'bangumi' | 'vndb' | 'ymgal') =>
    accountMap.has(provider)
  const isFeatureEnabled = (category: PlatformFeatureCategory, key: PlatformVisibilityKey) =>
    isPlatformFeatureEnabled(category, key, visibility.data, hasBoundAccount)
  const isVisible = (key: PlatformVisibilityKey) =>
    isPlatformConfigVisible(key, visibility.data, hasBoundAccount)
  const platformQuery = useQuery({
    queryKey: ['platform-settings'],
    queryFn: getPlatformSettingsApi,
  })
  const { data: platformSettings, isLoading: isLoadingPlatformSettings } = platformQuery
  const bangumiConfig = resolveBangumiProviderConfig(platformSettings?.bangumi)

  if (accountsQuery.isLoadingError || platformQuery.isLoadingError) {
    return (
      <PlatformSettingsError
        accountsError={accountsQuery.isLoadingError}
        platformError={platformQuery.isLoadingError}
        isRetrying={accountsQuery.isFetching || platformQuery.isFetching}
        onRetry={() => {
          if (accountsQuery.isLoadingError) void accountsQuery.refetch()
          if (platformQuery.isLoadingError) void platformQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PlatformVisibilityGrid
        isFeatureEnabled={isFeatureEnabled}
        isConfigVisible={isVisible}
        onChange={(category, platform, visible) => save.mutate({ category, platform, visible })}
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
          config={bangumiConfig}
          account={accountMap.get('bangumi')}
          isLoading={isLoading}
          isProcessing={processingProvider === 'bangumi'}
          onBind={() => void handleBind('bangumi')}
          onUnlink={() => void handleUnlink('bangumi')}
          inputValue={bangumiToken}
          onInputChange={setBangumiToken}
          inputType="password"
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

      {visibility.data &&
        IMAGE_PLATFORM_SECTIONS.map(
          (section) =>
            isVisible(section.key) && (
              <ImagePlatformSection
                key={section.key}
                section={section}
                values={platformSettings?.[section.key]}
                isLoading={isLoadingPlatformSettings}
              />
            ),
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
