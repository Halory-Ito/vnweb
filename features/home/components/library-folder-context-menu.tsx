import { FolderPlusIcon, ImageIcon } from 'lucide-react'

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

import type { ReactElement } from 'react'

export default function LibraryFolderContextMenu({
  children,
  onEdit,
  onCreate,
}: {
  children: ReactElement
  onEdit?: () => void
  onCreate?: () => void
}) {
  return (
    <ContextMenu modal={false}>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {onEdit ? (
          <ContextMenuItem onSelect={onEdit}>
            <ImageIcon /> 设置 Logo
          </ContextMenuItem>
        ) : null}
        {onCreate ? (
          <ContextMenuItem onSelect={onCreate}>
            <FolderPlusIcon /> 新建收藏夹
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}
