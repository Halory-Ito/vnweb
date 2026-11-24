import { PLATFORM_LABELS } from '../hooks/use-platform-accounts'
import { BANGUMI_OFFICIAL_TOKEN_URL } from '@/lib/settings/bangumi-settings'

import type { PlatformProvider } from './platform-account-section'
import type { PlatformCredentialLinkProps } from './platform-credential-link'

export const providerConfig: Record<
  PlatformProvider,
  {
    label: string
    icon: React.ReactNode
    description: string
    inputLabel?: string
    inputPlaceholder: string
    credentialLink?: PlatformCredentialLinkProps
  }
> = {
  steam: {
    label: PLATFORM_LABELS.steam,
    icon: <img src="/logos/steam.ico" alt="Steam" className="size-4 rounded-xs object-contain" />,
    description: '通过 Steam UID 绑定账号',
    inputPlaceholder: '请输入 17 位 Steam UID',
  },
  bangumi: {
    label: PLATFORM_LABELS.bangumi,
    inputLabel: '个人令牌',
    credentialLink: {
      href: BANGUMI_OFFICIAL_TOKEN_URL,
      usageLabel: 'Bangumi 个人令牌的用途',
      usage:
        '绑定时，VNWeb 会使用该个人令牌验证 Bangumi 账号、查询游戏和角色资料、导入收藏以及同步游玩状态。',
      label: '获取 Bangumi 个人令牌',
    },
    icon: (
      <img src="/logos/bangumi.ico" alt="Bangumi" className="size-4 rounded-xs object-contain" />
    ),
    description: '通过个人令牌绑定账号',
    inputPlaceholder: '请输入 Bangumi 个人令牌',
  },
  vndb: {
    label: PLATFORM_LABELS.vndb,
    inputLabel: 'API Token',
    credentialLink: {
      href: 'https://vndb.org/u/tokens',
      usageLabel: 'VNDB Token 的用途',
      usage: '绑定时，VNWeb 会使用该 Token 验证 VNDB 账号并读取用户资料。',
      label: '获取 VNDB Token',
    },
    icon: <img src="/logos/vndb.ico" alt="VNDB" className="size-4 rounded-xs object-contain" />,
    description: '通过 API Token 绑定账号',
    inputPlaceholder: '请输入 VNDB API Token',
  },
  ymgal: {
    label: PLATFORM_LABELS.ymgal,
    icon: <img src="/logos/ymgal.ico" alt="YMGal" className="size-4 rounded-xs object-contain" />,
    description: '通过用户 ID 绑定账号',
    inputPlaceholder: '请输入 YMGal 用户 ID',
  },
}
