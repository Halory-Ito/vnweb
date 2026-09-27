'use client'

import {
  BoxIcon,
  Gamepad2Icon,
  HomeIcon,
  MenuIcon,
  MusicIcon,
  PuzzleIcon,
  ScanIcon,
  SettingsIcon,
  TextQuoteIcon,
  VideoIcon,
  MapIcon,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

type NavItem = {
  title: string
  href: string
  icon?: React.ElementType
  iconSrc?: string
}

const navItems: NavItem[] = [
  { title: '主页', href: '/', icon: HomeIcon },
  { title: '游戏库', href: '/game', icon: Gamepad2Icon },
  { title: '记录', href: '/record', icon: BoxIcon },
  { title: '扫描', href: '/scan', icon: ScanIcon },
  { title: '攻略', href: '/guide', icon: MapIcon },
  { title: 'PV', href: '/pv', icon: VideoIcon },
  { title: 'OST', href: '/ost', icon: MusicIcon },
  { title: '摘录', href: '/quote', icon: TextQuoteIcon },
  { title: '设置', href: '/settings', icon: SettingsIcon },
]

const isActivePath = (pathname: string, href: string) => {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0">
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">打开菜单</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b p-4">
          <SheetTitle className="flex items-center gap-3">
            <Image
              src="/LOGO.png"
              alt="VNWeb Logo"
              loading="eager"
              width={32}
              height={32}
              className="object-contain"
            />
            <span>VNWeb</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isActivePath(pathname, item.href)

              return (
                <li key={item.title}>
                  <SheetClose asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      {item.iconSrc ? (
                        <div className="relative size-5 overflow-hidden rounded-xs">
                          <Image
                            src={item.iconSrc}
                            alt={item.title}
                            fill
                            sizes="20px"
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : Icon ? (
                        <Icon className="h-5 w-5" />
                      ) : (
                        <PuzzleIcon className="h-5 w-5" />
                      )}
                      {item.title}
                    </Link>
                  </SheetClose>
                </li>
              )
            })}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
