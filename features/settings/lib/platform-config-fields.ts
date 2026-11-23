import {
  BANGUMI_OFFICIAL_API_URL,
  BANGUMI_OFFICIAL_BASE_URL,
} from '@/lib/settings/bangumi-settings'
import { METING_BITRATES, METING_COVER_SIZES } from '@/lib/settings/meting-settings'

import type { PlatformProvider } from '../components/platform-account-section'
import type { PlatformFieldSpec } from '../components/platform-config-fields'

export const PLATFORM_CONFIG_FIELDS: Record<
  Exclude<PlatformProvider, 'vndb'>,
  readonly PlatformFieldSpec[]
> = {
  steam: [
    {
      key: 'apiKey',
      label: 'API Key',
      credentialLink: {
        href: 'https://steamcommunity.com/dev/apikey',
        usageLabel: 'Steam API Key 的用途',
        usage:
          '保存后，VNWeb 会使用该密钥查询 Steam 账号资料和游戏库，用于绑定账号、导入已拥有的游戏以及同步游玩时长。',
        label: '获取 Steam API Key',
      },
      placeholder: 'Steam Web API Key',
    },
  ],
  bangumi: [
    {
      key: 'useMirror',
      label: '接口来源',
      type: 'select',
      options: [
        { value: true, label: '镜像地址' },
        { value: false, label: '官方地址' },
      ],
    },
    {
      key: 'mirrorUrl',
      label: '接口镜像',
      type: 'url',
      placeholder: 'https://bgmapi.anibt.net',
      visibleWhen: ({ useMirror }) => useMirror === true,
    },
    {
      key: 'baseUrl',
      label: '站点镜像',
      type: 'url',
      placeholder: 'https://bgmmi.anibt.net',
      visibleWhen: ({ useMirror }) => useMirror === true,
    },
    {
      key: 'officialApiUrl',
      label: '官方接口',
      type: 'url',
      readOnlyValue: BANGUMI_OFFICIAL_API_URL,
      visibleWhen: ({ useMirror }) => useMirror === false,
    },
    {
      key: 'officialSiteUrl',
      label: '官方站点',
      type: 'url',
      readOnlyValue: BANGUMI_OFFICIAL_BASE_URL,
      visibleWhen: ({ useMirror }) => useMirror === false,
    },
    {
      key: 'apiKey',
      label: 'API Key',
      credentialLink: {
        href: 'https://next.bgm.tv/demo/access-token',
        usageLabel: 'Bangumi 个人令牌的用途',
        usage: 'VNWeb 会在查询 Bangumi 的游戏和角色资料时附上此个人令牌，用于 API 验证。',
        label: '获取 Bangumi 个人令牌',
      },
      placeholder: 'Bangumi Access Token',
    },
    { key: 'oauthClientId', label: 'OAuth Client ID', placeholder: 'Client ID' },
    { key: 'oauthClientSecret', label: 'OAuth Client Secret', placeholder: 'Client Secret' },
  ],
  ymgal: [
    { key: 'baseUrl', label: '站点地址', type: 'url', placeholder: 'https://www.ymgal.games' },
    {
      key: 'clientId',
      label: 'Client ID',
      credentialLink: {
        href: 'https://www.ymgal.games/developer',
        usageLabel: 'YMGal 客户端凭据的用途',
        usage:
          'VNWeb 会使用 Client ID 和 Client Secret 换取访问令牌，用于调用月幕开放 API 查询游戏资料。',
        label: '查看 Client Info',
      },
      placeholder: 'Client ID',
    },
    { key: 'clientSecret', label: 'Client Secret', placeholder: 'Client Secret' },
  ],
}

export const METING_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'bitrate',
    label: '播放码率',
    type: 'select',
    options: METING_BITRATES.map((value) => ({ value, label: value + ' kbps' })),
  },
  {
    key: 'coverSize',
    label: '封面尺寸',
    type: 'select',
    options: METING_COVER_SIZES.map((value) => ({ value, label: value + ' px' })),
  },
  { key: 'neteaseCookie', label: '网易云 Cookie', type: 'password' },
]
