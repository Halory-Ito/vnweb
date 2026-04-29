'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  blob: Blob | null
  currentTime: number
  duration: number
  activeColor: string
  baseColor: string
}

export default function NativeWaveform({
  blob,
  currentTime,
  duration,
  activeColor,
  baseColor,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [peaks, setPeaks] = useState<number[]>([])
  const [isDecoding, setIsDecoding] = useState(false)

  useEffect(() => {
    if (!blob) {
      setPeaks([])
      return
    }

    let isCancelled = false
    setIsDecoding(true)

    const decode = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer()
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext
        const audioCtx = new AudioCtx()

        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        if (isCancelled) return

        const channelData = audioBuffer.getChannelData(0)
        // 动态计算柱子数量，最多 150 个
        const samples = 150
        const step = Math.ceil(channelData.length / samples)
        const newPeaks: number[] = []

        for (let i = 0; i < samples; i++) {
          let max = 0
          for (let j = 0; j < step; j++) {
            const index = i * step + j
            if (index < channelData.length) {
              const val = Math.abs(channelData[index])
              if (val > max) max = val
            }
          }
          newPeaks.push(max)
        }
        if (!isCancelled) setPeaks(newPeaks)
      } catch (e) {
        console.warn('Waveform decode error', e)
        if (!isCancelled) setPeaks([]) // 解析失败清空
      } finally {
        if (!isCancelled) setIsDecoding(false)
      }
    }

    void decode()

    return () => {
      isCancelled = true
    }
  }, [blob])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (peaks.length === 0) return

    const barWidth = 3
    const gap = 2
    // 根据算出的宽度居中对齐
    const totalWidth = peaks.length * (barWidth + gap)
    const startX = (canvas.width - totalWidth) / 2

    const progress = duration > 0 ? currentTime / duration : 0
    const activeEndIndex = Math.floor(progress * peaks.length)

    peaks.forEach((peak, i) => {
      // 防止有些歌曲声音太小，将峰值稍微放大，但最多不超过画布高
      const normalizePeak = Math.min(peak * 1.5, 1)
      const barHeight = Math.max(normalizePeak * canvas.height * 0.8, 2)

      const x = startX + i * (barWidth + gap)
      const y = (canvas.height - barHeight) / 2

      ctx.fillStyle = i <= activeEndIndex ? activeColor : baseColor
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 2)
      ctx.fill()
    })
  }, [peaks, currentTime, duration, activeColor, baseColor])

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {(!blob || isDecoding) && (
        <div className="text-muted-foreground absolute inset-0 flex animate-pulse flex-col items-center justify-center text-xs">
          {!blob && !isDecoding ? '正在缓冲音频数据...' : '正在解析音频波形...'}
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={800}
        height={100}
        className="h-full w-full object-contain"
        style={{ opacity: peaks.length > 0 ? 1 : 0 }}
      />
    </div>
  )
}
