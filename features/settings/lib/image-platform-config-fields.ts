import type { PlatformFieldSpec } from '../components/platform-config-fields'

export const STEAMGRIDDB_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://www.steamgriddb.com/profile/preferences/api',
      usageLabel: 'SteamGridDB API Key 的用途',
      usage:
        '保存后，VNWeb 会使用该密钥调用 SteamGridDB 接口搜索并补全游戏封面、背景图、图标和徽标。',
      label: '获取 SteamGridDB API Key',
    },
    placeholder: 'SteamGridDB API Key',
  },
  {
    key: 'baseUrl',
    label: '接口地址',
    type: 'url',
    placeholder: 'https://www.steamgriddb.com/api/v2',
  },
]

export const IGDB_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'clientId',
    label: 'Client ID',
    credentialLink: {
      href: 'https://dev.twitch.tv/console/apps',
      usageLabel: 'IGDB Twitch 凭据的用途',
      usage:
        'VNWeb 会使用 Twitch 开发者应用的 Client ID 与 Client Secret 自动换取访问令牌，调用 IGDB v4 搜索封面、官方插画与截图。',
      label: '获取 Twitch 应用凭据',
    },
    placeholder: 'Twitch Client ID',
  },
  {
    key: 'clientSecret',
    label: 'Client Secret',
    type: 'password',
    placeholder: 'Twitch Client Secret',
  },
  {
    key: 'baseUrl',
    label: '接口地址',
    type: 'url',
    placeholder: 'https://api.igdb.com/v4',
  },
]

export const RAWG_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://rawg.io/apidocs',
      usageLabel: 'RAWG API Key 的用途',
      usage: '保存后，VNWeb 会使用该密钥调用 RAWG 接口搜索游戏背景图与高清截图。',
      label: '获取 RAWG API Key',
    },
    placeholder: 'RAWG API Key',
  },
  {
    key: 'baseUrl',
    label: '接口地址',
    type: 'url',
    placeholder: 'https://api.rawg.io/api',
  },
]

export const THEGAMESDB_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://thegamesdb.net/',
      usageLabel: 'TheGamesDB API Key 的用途',
      usage:
        '保存后，VNWeb 会使用该密钥调用 TheGamesDB v1 接口搜索封面盒绘、Fanart、横幅、透明 Logo 与截图。',
      label: '获取 TheGamesDB API Key',
    },
    placeholder: 'TheGamesDB API Key',
  },
  {
    key: 'baseUrl',
    label: '接口地址',
    type: 'url',
    placeholder: 'https://api.thegamesdb.net',
  },
]

export const GIANTBOMB_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://www.giantbomb.com/api/',
      usageLabel: 'Giant Bomb API Key 的用途',
      usage: '保存后，VNWeb 会使用该密钥调用 Giant Bomb 接口搜索游戏封面与官方相册图集。',
      label: '获取 Giant Bomb API Key',
    },
    placeholder: 'Giant Bomb API Key',
  },
  {
    key: 'baseUrl',
    label: '接口地址',
    type: 'url',
    placeholder: 'https://www.giantbomb.com/api',
  },
]

export const YANDERE_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'baseUrl',
    label: '站点地址',
    type: 'url',
    placeholder: 'https://yande.re',
  },
  {
    key: 'allowNsfw',
    label: '默认分级',
    type: 'select',
    options: [
      { value: false, label: '仅全年龄' },
      { value: true, label: '包含 NSFW' },
    ],
  },
]

export const KONACHAN_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'baseUrl',
    label: '站点地址',
    type: 'url',
    placeholder: 'https://konachan.net',
  },
  {
    key: 'allowNsfw',
    label: '默认分级',
    type: 'select',
    options: [
      { value: false, label: '仅全年龄' },
      { value: true, label: '包含 NSFW' },
    ],
  },
]

export const SAFEBOORU_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'baseUrl',
    label: '站点地址',
    type: 'url',
    placeholder: 'https://safebooru.org',
  },
]

export const DANBOORU_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'username',
    label: '用户名',
    placeholder: 'Danbooru Username',
  },
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://danbooru.donmai.us/profile',
      usageLabel: 'Danbooru API Key 的用途',
      usage:
        '保存后，VNWeb 会结合用户名使用 HTTP Basic 鉴权调用 Danbooru 接口搜索游戏同人与官方插画。',
      label: '获取 Danbooru API Key',
    },
    placeholder: 'Danbooru API Key',
  },
  {
    key: 'baseUrl',
    label: '站点地址',
    type: 'url',
    placeholder: 'https://danbooru.donmai.us',
  },
  {
    key: 'allowNsfw',
    label: '默认分级',
    type: 'select',
    options: [
      { value: false, label: '仅全年龄' },
      { value: true, label: '包含 NSFW' },
    ],
  },
]

export const GELBOORU_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'userId',
    label: 'User ID',
    placeholder: 'Gelbooru User ID',
  },
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://gelbooru.com/index.php?page=account&s=options',
      usageLabel: 'Gelbooru API Key 的用途',
      usage: '保存后，VNWeb 会结合 User ID 调用 Gelbooru DAPI 接口搜索游戏 CG 与壁纸。',
      label: '获取 Gelbooru API 凭据',
    },
    placeholder: 'Gelbooru API Key',
  },
  {
    key: 'baseUrl',
    label: '站点地址',
    type: 'url',
    placeholder: 'https://gelbooru.com',
  },
  {
    key: 'allowNsfw',
    label: '默认分级',
    type: 'select',
    options: [
      { value: false, label: '仅全年龄' },
      { value: true, label: '包含 NSFW' },
    ],
  },
]

export const WALLHAVEN_CONFIG_FIELDS: readonly PlatformFieldSpec[] = [
  {
    key: 'apiKey',
    label: 'API Key',
    credentialLink: {
      href: 'https://wallhaven.cc/settings/account',
      usageLabel: 'Wallhaven API Key 的用途',
      usage: '保存后，VNWeb 会使用该密钥调用 Wallhaven v1 接口搜索高分辨率壁纸并支持分级筛选。',
      label: '获取 Wallhaven API Key',
    },
    placeholder: 'Wallhaven API Key',
  },
  {
    key: 'baseUrl',
    label: '接口地址',
    type: 'url',
    placeholder: 'https://wallhaven.cc/api/v1',
  },
  {
    key: 'allowNsfw',
    label: '默认分级',
    type: 'select',
    options: [
      { value: false, label: '仅全年龄' },
      { value: true, label: '包含 NSFW' },
    ],
  },
]

export type ImagePlatformKey =
  | 'steamgriddb'
  | 'igdb'
  | 'rawg'
  | 'thegamesdb'
  | 'giantbomb'
  | 'yandere'
  | 'konachan'
  | 'safebooru'
  | 'danbooru'
  | 'gelbooru'
  | 'wallhaven'

export type ImagePlatformSectionMeta = {
  key: ImagePlatformKey
  title: string
  homepageUrl: string
  fields: readonly PlatformFieldSpec[]
}

export const IMAGE_PLATFORM_SECTIONS: readonly ImagePlatformSectionMeta[] = [
  {
    key: 'steamgriddb',
    title: 'SteamGridDB',
    homepageUrl: 'https://www.steamgriddb.com',
    fields: STEAMGRIDDB_CONFIG_FIELDS,
  },
  {
    key: 'igdb',
    title: 'IGDB',
    homepageUrl: 'https://www.igdb.com',
    fields: IGDB_CONFIG_FIELDS,
  },
  {
    key: 'rawg',
    title: 'RAWG',
    homepageUrl: 'https://rawg.io',
    fields: RAWG_CONFIG_FIELDS,
  },
  {
    key: 'thegamesdb',
    title: 'TheGamesDB',
    homepageUrl: 'https://thegamesdb.net',
    fields: THEGAMESDB_CONFIG_FIELDS,
  },
  {
    key: 'giantbomb',
    title: 'Giant Bomb',
    homepageUrl: 'https://www.giantbomb.com',
    fields: GIANTBOMB_CONFIG_FIELDS,
  },
  {
    key: 'yandere',
    title: 'Yande.re',
    homepageUrl: 'https://yande.re',
    fields: YANDERE_CONFIG_FIELDS,
  },
  {
    key: 'konachan',
    title: 'Konachan',
    homepageUrl: 'https://konachan.net',
    fields: KONACHAN_CONFIG_FIELDS,
  },
  {
    key: 'safebooru',
    title: 'Safebooru',
    homepageUrl: 'https://safebooru.org',
    fields: SAFEBOORU_CONFIG_FIELDS,
  },
  {
    key: 'danbooru',
    title: 'Danbooru',
    homepageUrl: 'https://danbooru.donmai.us',
    fields: DANBOORU_CONFIG_FIELDS,
  },
  {
    key: 'gelbooru',
    title: 'Gelbooru',
    homepageUrl: 'https://gelbooru.com',
    fields: GELBOORU_CONFIG_FIELDS,
  },
  {
    key: 'wallhaven',
    title: 'Wallhaven',
    homepageUrl: 'https://wallhaven.cc',
    fields: WALLHAVEN_CONFIG_FIELDS,
  },
]
