import {
  BoxIcon,
  Gamepad2Icon,
  HomeIcon,
  MapIcon,
  MusicIcon,
  ScanIcon,
  SettingsIcon,
  TextQuoteIcon,
  VideoIcon,
} from 'lucide-react'

export const primaryNavigation = [
  { title: '主页', href: '/', icon: HomeIcon },
  { title: '游戏库', href: '/game', icon: Gamepad2Icon },
  { title: '记录', href: '/record', icon: BoxIcon },
  { title: '扫描', href: '/scan', icon: ScanIcon },
  { title: '攻略', href: '/guide', icon: MapIcon },
  { title: 'PV', href: '/pv', icon: VideoIcon },
  { title: 'OST', href: '/ost', icon: MusicIcon },
  { title: '摘录', href: '/quote', icon: TextQuoteIcon },
]

export const settingsNavigation = { title: '设置', href: '/settings', icon: SettingsIcon }

export function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`))
}
