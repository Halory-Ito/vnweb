'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BoxIcon,
  HomeIcon,
  ScanIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

type SidebarItem = {
  title: string
  href: string
  icon: React.ElementType
}

const contentItems: SidebarItem[] = [
  { title: '主页', href: '/game', icon: HomeIcon },
  { title: '记录', href: '/record', icon: BoxIcon },
  { title: '扫描', href: '/scan', icon: ScanIcon },
]

const footerItems: SidebarItem[] = [
  // { title: '游戏主页', href: '/game/home', icon: UserIcon },
  { title: '设置', href: '/settings', icon: SettingsIcon },
]

const isActivePath = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarIconButton({
  item,
  pathname,
}: {
  item: SidebarItem
  pathname: string
}) {
  const Icon = item.icon

  return (
    <SidebarMenuItem>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            asChild
            isActive={isActivePath(pathname, item.href)}
          >
            <Link
              href={item.href}
              aria-label={item.title}
              className="justify-center"
            >
              <Icon />
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

  return (
    <Sidebar
      collapsible="none"
      className="w-24 
    border-r bg-background shadow-xs dark:bg-input/0 dark:border-input
    "
    >
      <SidebarHeader className="items-center pt-4">
        <Link
          href="/game"
          className="flex h-10 w-10 items-center justify-center rounded-md border font-semibold"
          aria-label="VNWeb Logo"
        >
          VN
        </Link>
      </SidebarHeader>

      <SidebarContent className="items-center p-2">
        <SidebarMenu className="p-4 gap-4">
          {contentItems.map((item) => (
            <SidebarIconButton
              key={item.title}
              item={item}
              pathname={pathname}
            />
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="items-center pb-4">
        <SidebarMenu className="p-4 gap-4">
          {footerItems.map((item) => (
            <SidebarIconButton
              key={item.title}
              item={item}
              pathname={pathname}
            />
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
