'use client'

import { useEffect, useRef } from 'react'

import { getImmersiveTheme, type ImmersiveThemeId } from '../../lib/immersive-themes'
import {
  createCanvasState,
  drawFumeCanvas,
  drawHanabiCanvas,
  drawLumiereCanvas,
  drawMonetCanvas,
  drawPartitaCanvas,
  spawnFireworkBurst,
  type VisualizerCanvasState,
} from '../../lib/visualizer-renderers'

type VisualizerCanvasProps = {
  theme: Exclude<ImmersiveThemeId, 'backdrop'>
  isPlaying: boolean
  activeIndex: number
}

export function VisualizerCanvas({ theme, isPlaying, activeIndex }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playingRef = useRef(isPlaying)
  playingRef.current = isPlaying
  const stateRef = useRef<VisualizerCanvasState | null>(null)
  const sizeRef = useRef({ width: 0, height: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const palette = getImmersiveTheme(theme).palette
    let rafId = 0
    let phase = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const width = canvas.clientWidth || window.innerWidth
      const height = canvas.clientHeight || window.innerHeight
      sizeRef.current = { width, height }
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stateRef.current = createCanvasState(width, height)
    }

    resize()
    window.addEventListener('resize', resize)

    const render = () => {
      const { width, height } = sizeRef.current
      const state = stateRef.current
      if (!state) return

      phase += playingRef.current ? 0.016 : 0.004
      if (theme === 'monet') {
        drawMonetCanvas(ctx, width, height, phase, palette, playingRef.current)
      } else if (theme === 'lumiere') {
        drawLumiereCanvas(ctx, width, height, phase, state, palette)
      } else if (theme === 'fume') {
        drawFumeCanvas(ctx, width, height, phase, state, palette)
      } else if (theme === 'partita') {
        drawPartitaCanvas(ctx, width, height, phase, palette)
      } else {
        drawHanabiCanvas(ctx, width, height, phase, state, palette, playingRef.current)
      }
      if (!reduceMotion) rafId = window.requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(rafId)
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'hanabi' || !isPlaying || !stateRef.current) return
    const { width, height } = sizeRef.current
    const palette = getImmersiveTheme('hanabi').palette
    spawnFireworkBurst(stateRef.current, width, height, palette)
  }, [activeIndex, isPlaying, theme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 size-full"
    />
  )
}
