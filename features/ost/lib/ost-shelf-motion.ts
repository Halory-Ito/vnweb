import type { CSSProperties } from 'react'

export const shelfRecordClass = 'aspect-[12/13] w-(--ost-disc-width) max-w-48 justify-self-center'

export type ShelfTierStyle = CSSProperties & Record<`--${string}`, string>

export function getShelfTierStyle(count: number): ShelfTierStyle {
  const density = Math.min(1, Math.max(0, (count - 10) / 15))
  return {
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    columnGap: `${Math.max(0, 10 - count)}px`,
    maxWidth: `min(100rem, ${count * 10 + 3}rem)`,
    '--ost-disc-angle': `${count < 10 ? 32 + count * 2 : 52 + density * 20}deg`,
    '--ost-disc-width': `${135 + density * 105}%`,
  }
}

export type TierMotionCustom = {
  direction: number
  tierIndex: number
  reduceMotion: boolean
}

const shelfEaseOut = [0.22, 1, 0.36, 1] as const
const shelfEaseIn = [0.4, 0, 1, 1] as const

export const tierRowVariants = {
  enter: ({ direction, reduceMotion }: TierMotionCustom) =>
    reduceMotion || !direction
      ? { opacity: 0 }
      : {
          x: `${direction * 14}%`,
          opacity: 1,
        },
  center: ({ tierIndex, reduceMotion }: TierMotionCustom) => ({
    x: '0%',
    opacity: 1,
    transition: reduceMotion
      ? { duration: 0.15 }
      : {
          duration: 0.42,
          delay: tierIndex * 0.035,
          ease: shelfEaseOut,
        },
  }),
  exit: ({ direction, tierIndex, reduceMotion }: TierMotionCustom) =>
    reduceMotion || !direction
      ? {
          opacity: 0,
          pointerEvents: 'none' as const,
          transition: { duration: 0.12 },
        }
      : {
          x: `${-direction * 22}%`,
          opacity: 0,
          scale: 0.985,
          pointerEvents: 'none' as const,
          transition: {
            duration: 0.24,
            delay: tierIndex * 0.025,
            ease: shelfEaseIn,
          },
        },
}

export const discRestingState = {
  opacity: 1,
  x: 0,
  y: 0,
  rotate: 0,
  scale: 1,
} as const

export function getDiscEnterInitial(direction: number) {
  return {
    opacity: 0,
    x: direction * 28,
    y: -6,
    rotate: direction * 5,
    scale: 0.96,
  }
}

export function getDiscEnterTransition(delay: number) {
  return {
    opacity: { duration: 0.2, delay, ease: 'easeOut' as const },
    x: { duration: 0.4, delay, ease: shelfEaseOut },
    y: { duration: 0.36, delay, ease: shelfEaseOut },
    scale: { duration: 0.36, delay, ease: shelfEaseOut },
    rotate: {
      type: 'spring' as const,
      stiffness: 250,
      damping: 19,
      mass: 0.85,
      delay: delay + 0.03,
    },
  }
}
