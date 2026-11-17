'use client'

import { useGameCoverTilt } from '../../hooks/use-game-cover-tilt'

type GameCoverProps = {
  cover: string | null
  title: string
}

export default function GameCover({ cover, title }: GameCoverProps) {
  const tiltProps = useGameCoverTilt()

  if (!cover) {
    return (
      <div className="flex h-44 w-32 items-center justify-center rounded-md border text-sm md:h-56 md:w-40">
        游戏封面
      </div>
    )
  }

  return (
    <div
      {...tiltProps}
      data-slot="game-cover"
      className="group/cover relative w-32 shrink-0 [--cover-light-x:50%] [--cover-light-y:35%] [--cover-rotate-x:-4deg] [--cover-rotate-y:-12deg] [perspective:900px] md:w-40"
    >
      <div
        data-slot="game-cover-body"
        className="relative [transform:translateY(var(--cover-lift,0px))_rotateX(var(--cover-rotate-x))_rotateY(var(--cover-rotate-y))] [transform-style:preserve-3d] group-data-[tilting=true]/cover:[--cover-lift:-3px] motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out motion-reduce:transform-none"
      >
        <div
          aria-hidden="true"
          className="bg-muted pointer-events-none absolute inset-0 [transform:translateZ(-6px)] rounded-md border"
        />
        <div
          aria-hidden="true"
          className="from-muted-foreground/40 via-muted to-muted-foreground/60 pointer-events-none absolute inset-y-0 right-0 w-3 origin-right [transform:translateZ(-6px)_rotateY(90deg)] rounded-r-sm border bg-linear-to-r [backface-visibility:hidden]"
        />
        <div
          aria-hidden="true"
          className="from-muted to-muted-foreground/40 pointer-events-none absolute inset-x-0 top-0 h-3 origin-top [transform:translateZ(-6px)_rotateX(90deg)] rounded-t-sm border bg-linear-to-b [backface-visibility:hidden]"
        />
        <div className="bg-background relative [transform:translateZ(6px)] overflow-hidden rounded-md border shadow-[0_12px_28px_-12px_rgb(0_0_0/0.35)] [backface-visibility:hidden] dark:shadow-[0_16px_32px_-12px_rgb(0_0_0/0.6)]">
          <img
            src={cover}
            alt={`${title || '游戏'}封面`}
            draggable={false}
            className="block h-auto w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-black/15 via-transparent via-15% to-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_var(--cover-light-x)_var(--cover-light-y),rgb(255_255_255/0.3),transparent_75%)] opacity-40 group-data-[tilting=true]/cover:opacity-100 motion-safe:transition-opacity motion-safe:duration-300"
          />
        </div>
      </div>
    </div>
  )
}
