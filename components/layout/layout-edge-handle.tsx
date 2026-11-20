'use client'

import { cn } from '@/lib/utils'

import type { useLayoutEdgeDrag } from '@/hooks/use-layout-edge-drag'

export default function LayoutEdgeHandle({
  side,
  hidden,
  handlers,
  className,
  label,
}: {
  side: 'left' | 'top'
  hidden: boolean
  handlers: ReturnType<typeof useLayoutEdgeDrag>
  className?: string
  label?: string
}) {
  const isSidebar = side === 'left'
  const action = label ?? `${hidden ? '显示' : '隐藏'}${isSidebar ? '侧边栏' : '顶栏'}`
  const direction = isSidebar ? (hidden ? '右' : '左') : hidden ? '下' : '上'

  return (
    <button
      {...handlers}
      type="button"
      aria-label={action}
      title={`向${direction}拖动或点击${action}`}
      className={cn(
        'group absolute z-10 grid touch-none place-items-center outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        isSidebar ? 'w-3 cursor-ew-resize' : 'h-3 cursor-ns-resize',
        hidden
          ? isSidebar
            ? 'inset-y-1/4 left-0'
            : 'inset-x-1/4 top-0'
          : isSidebar
            ? 'inset-y-0 right-0'
            : 'inset-x-0 bottom-0',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'bg-muted-foreground/45 group-hover:bg-foreground/65 group-focus-visible:bg-foreground/65 pointer-events-none rounded-full transition-colors motion-reduce:transition-none',
          isSidebar ? 'h-7 w-0.5' : 'h-0.5 w-7',
        )}
      />
    </button>
  )
}
