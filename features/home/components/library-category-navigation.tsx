import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'

import { useLibraryCategoryNavigation } from '../hooks/use-library-category-navigation'
import { getLibraryFolderHref } from '../lib/library-grouping'
import LibraryCategoryIcon from './library-category-icon'
import LibraryFolderContextMenu from './library-folder-context-menu'
import LibraryFolderLogoDialog from './library-folder-logo-dialog'
import { Button } from '@/components/ui/button'
import { resolveLayoutLibraryGroup } from '@/lib/settings/layout-settings'

export default function LibraryCategoryNavigation() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { folders, isPending } = useLibraryCategoryNavigation()
  const [logoFolderHref, setLogoFolderHref] = useState<string>()
  const logoFolder = folders.find(({ href, canSetLogo }) => canSetLogo && href === logoFolderHref)
  const group = resolveLayoutLibraryGroup(searchParams.get('group'), searchParams.get('field'))
  const key = searchParams.get(group === 'status' ? 'status' : 'folder')
  const activeHref =
    pathname === '/game/home' ? getLibraryFolderHref(group, key ?? undefined) : pathname

  if (isPending) return null

  return (
    <nav
      aria-label="游戏分类"
      className="flex min-w-0 gap-1 overflow-x-auto p-2 md:flex-col md:overflow-x-hidden"
    >
      {folders.map(({ href, title, games, logo, canSetLogo }) => {
        const active = href === activeHref
        const link = (
          <Button
            key={href}
            asChild
            variant={active ? 'outline' : 'ghost'}
            className="max-w-56 justify-start md:w-full md:max-w-none"
          >
            <Link href={href} aria-current={active ? 'page' : undefined}>
              <LibraryCategoryIcon key={logo} logo={logo} />
              <span className="min-w-0 flex-1 truncate" title={title}>
                {title}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">{games.length}</span>
            </Link>
          </Button>
        )
        return canSetLogo ? (
          <LibraryFolderContextMenu key={href} onEdit={() => setLogoFolderHref(href)}>
            {link}
          </LibraryFolderContextMenu>
        ) : (
          link
        )
      })}
      {logoFolder ? (
        <LibraryFolderLogoDialog
          key={logoFolder.href}
          href={logoFolder.href}
          title={logoFolder.title}
          source={logoFolder.logo}
          localOnly={logoFolder.localOnly}
          onClose={() => setLogoFolderHref(undefined)}
        />
      ) : null}
    </nav>
  )
}
