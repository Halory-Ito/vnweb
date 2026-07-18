'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BoxIcon,
  HomeIcon,
  MapIcon,
  TextQuoteIcon,
  MusicIcon,
  PuzzleIcon,
  ScanIcon,
  SettingsIcon,
  ShoppingBasketIcon,
  VideoIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { api } from '@/lib/request-utils'
import { cn } from '@/lib/utils'

type SidebarItem = {
  title: string
  href: string
  icon?: React.ElementType
  iconSrc?: string
}

type PluginItem = {
  id: string
  name: string
  icon: string
  installed?: boolean
}

const contentItems: SidebarItem[] = [
  { title: '主页', href: '/game', icon: HomeIcon },
  { title: '记录', href: '/record', icon: BoxIcon },
  { title: '扫描', href: '/scan', icon: ScanIcon },
  // { title: '攻略', href: '/guide', icon: MapIcon },
  { title: 'PV', href: '/pv', icon: VideoIcon },
  { title: 'OST', href: '/ost', icon: MusicIcon },
  { title: '摘录', href: '/quote', icon: TextQuoteIcon },
]

const footerItems: SidebarItem[] = [
  // { title: '游戏主页', href: '/game/home', icon: UserIcon },
  // { title: '插件市场', href: '/market', icon: ShoppingBasketIcon },
  { title: '设置', href: '/settings', icon: SettingsIcon },
]

const isActivePath = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

const SIDEBAR_BUTTON_SIZE = 'h-10 w-10'

function SidebarIconButton({ item, pathname }: { item: SidebarItem; pathname: string }) {
  const Icon = item.icon
  const isActive = isActivePath(pathname, item.href)

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={isActive}
            className={cn(
              SIDEBAR_BUTTON_SIZE,
              'transition-colors duration-200',
              isActive
                ? 'relative bg-primary/10 text-primary before:absolute before:top-1/2 before:left-0 before:h-5 before:w-0.75 before:-translate-y-1/2 before:rounded-r-full before:bg-primary before:content-[""] dark:bg-primary/20'
                : 'hover:bg-sidebar-accent/60',
            )}
          >
            <Link href={item.href} aria-label={item.title} className="justify-center">
              {item.iconSrc ? (
                <div className="bg-muted relative size-4 overflow-hidden rounded-xs">
                  <Image
                    src={item.iconSrc}
                    alt={item.title}
                    fill
                    sizes="16px"
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : Icon ? (
                <Icon />
              ) : (
                <PuzzleIcon />
              )}
              <span className="sr-only">{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    </SidebarMenuItem>
  )
}

export default function AppSideBar() {
  const pathname = usePathname()

  const { data: plugins = [] } = useQuery<PluginItem[]>({
    queryKey: ['plugins'],
    queryFn: async () => {
      const response = await api.get('/market/plugins')
      return response.data
    },
  })

  const installedPluginItems: SidebarItem[] = plugins
    .filter((plugin) => plugin.installed)
    .map((plugin) => ({
      title: plugin.name,
      href: `/addOns/${plugin.id}/home`,
      iconSrc: plugin.icon,
    }))

  return (
    <Sidebar
      collapsible="none"
      className="bg-background dark:bg-input/0 dark:border-input w-24 border-r shadow-xs"
    >
      <SidebarHeader className="items-center pt-4">
        <Link
          href="/game"
          className="flex h-10 w-10 items-center justify-center rounded-md font-semibold"
          aria-label="VNWeb Logo"
        >
          <Image
            src="/LOGO.png"
            alt="VNWeb Logo"
            width={36}
            height={36}
            className="object-contain"
          />
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarMenu className="flex flex-col items-center justify-center">
          {contentItems.map((item) => (
            <SidebarIconButton key={item.title} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>

        {installedPluginItems.length > 0 && (
          <SidebarMenu className="gap-3 p-4 pt-2">
            {installedPluginItems.map((item) => (
              <SidebarIconButton key={item.href} item={item} pathname={pathname} />
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>

      <SidebarFooter className="items-center pb-4">
        <SidebarMenu className="gap-4 p-4">
          {footerItems.map((item) => (
            <SidebarIconButton key={item.title} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
