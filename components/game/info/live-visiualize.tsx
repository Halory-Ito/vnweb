'use client'

import React, { useEffect, useRef } from 'react'

interface LiveVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
  isPlaying: boolean
  color: string
}

export default function LiveVisualizer({
  audioRef,
  isPlaying,
  color,
}: LiveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)

  // 使用 Ref 保持 Web Audio 节点的引用，避免重新创建导致的音频波动
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  // 用于平滑动画的缓存数组
  const prevHeights = useRef<number[]>([])
  // 用于随机分布的索引映射表
  const randomIndexMap = useRef<number[]>([])

  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return

    const audio = audioRef.current

    // --- 1. 初始化 Web Audio 节点 (绑定到音频元素以复用) ---
    // 避免切换 Tab 时组件刷新导致创建多个 AudioContext 引发音量异常或警告
    let ctx = (audio as any).__audioCtx as AudioContext
    let analyser = (audio as any).__analyser as AnalyserNode

    if (!ctx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext
      ctx = new AudioContextClass()
      analyser = ctx.createAnalyser()

      // fftSize 决定了条形的密集度，256 产生 128 条数据
      analyser.fftSize = 256
      // 增加平滑系数 (0-1)，数值越大，跳动越柔和
      analyser.smoothingTimeConstant = 0.8

      try {
        // 将音频元素连接到分析器
        const source = ctx.createMediaElementSource(audio)
        source.connect(analyser)
        analyser.connect(ctx.destination)

        ;(audio as any).__audioCtx = ctx
        ;(audio as any).__analyser = analyser
        ;(audio as any).__source = source
      } catch (err) {
        // 捕获“节点已连接”的异常
        console.warn('Audio source connection warning:', err)
      }
    }

    if (!analyserRef.current) {
      analyserRef.current = analyser
      // 生成随机索引映射表：打破频率降序规律，让视觉分布更随机
      const bufferLength = analyser.frequencyBinCount
      if (randomIndexMap.current.length !== bufferLength) {
        randomIndexMap.current = Array.from(
          { length: bufferLength },
          (_, i) => i,
        ).sort(() => Math.random() - 0.5)
      }
    }

    // --- 2. 绘制逻辑 ---
    const canvas = canvasRef.current
    const canvasCtx = canvas.getContext('2d')!
    const bufferLength = analyserRef.current!.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      if (!isPlaying) return

      animationRef.current = requestAnimationFrame(draw)
      analyserRef.current!.getByteFrequencyData(dataArray)

      // 清除画布
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 1.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        // 使用随机映射，获取乱序后的频率数据
        const mappedIndex = randomIndexMap.current[i]
        const rawHeight = (dataArray[mappedIndex] / 255) * canvas.height

        // 平滑处理：当前高度 = 上次高度 + (目标高度 - 上次高度) * 缓冲系数
        if (!prevHeights.current[i]) prevHeights.current[i] = 0
        prevHeights.current[i] += (rawHeight - prevHeights.current[i]) * 0.2

        const barHeight = Math.max(prevHeights.current[i], 4) // 最小保持 4px 高度

        // 设置颜色和透明度
        canvasCtx.fillStyle = color
        canvasCtx.globalAlpha = 0.8

        // --- 居中绘制波纹 ---
        // 计算起始 y 坐标，使得柱形在画布垂直中心向上下延申
        const y = (canvas.height - barHeight) / 2

        // 绘制圆角矩形
        canvasCtx.beginPath()
        if (canvasCtx.roundRect) {
          canvasCtx.roundRect(x, y, barWidth - 2, barHeight, 4)
        } else {
          // 兼容旧版浏览器
          canvasCtx.rect(x, y, barWidth - 2, barHeight)
        }
        canvasCtx.fill()

        x += barWidth
      }
    }

    if (isPlaying) {
      // 恢复因浏览器安全策略可能被挂起的 AudioContext
      const currentCtx = (audio as any).__audioCtx as AudioContext
      if (currentCtx?.state === 'suspended') {
        currentCtx.resume()
      }
      draw()
    } else {
      cancelAnimationFrame(animationRef.current)
      // 停止时，手动清空并绘制一组静止的短线
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height)
    }

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isPlaying, color, audioRef])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full transition-opacity duration-500"
      // 这里的宽高决定了绘图分辨率，CSS 控制实际显示大小
      width={1000}
      height={200}
    />
  )
}
