export type CanvasParticle = {
  x: number
  y: number
  r: number
  vx: number
  vy: number
  alpha: number
  colorIdx: number
}

export type FireworkSpark = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
}

export type VisualizerCanvasState = {
  particles: CanvasParticle[]
  sparks: FireworkSpark[]
  lastBurstAt: number
}

export function createCanvasState(width: number, height: number): VisualizerCanvasState {
  const particles: CanvasParticle[] = Array.from({ length: 34 }, (_, i) => ({
    x: (((i * 197.3) % 1000) / 1000) * width,
    y: (((i * 353.7) % 1000) / 1000) * height,
    r: 1.4 + (i % 5) * 0.9,
    vx: ((i % 7) - 3) * 0.14,
    vy: 0.14 + (i % 4) * 0.16,
    alpha: 0.2 + (i % 5) * 0.1,
    colorIdx: i % 4,
  }))
  return { particles, sparks: [], lastBurstAt: 0 }
}

export function spawnFireworkBurst(
  state: VisualizerCanvasState,
  width: number,
  height: number,
  palette: [string, string, string, string],
) {
  if (width <= 0 || height <= 0) return
  const onLeft = Math.random() < 0.5
  const cx = width * (onLeft ? 0.12 + Math.random() * 0.22 : 0.66 + Math.random() * 0.22)
  const cy = height * (0.18 + Math.random() * 0.42)
  const color = palette[Math.floor(Math.random() * palette.length)]
  const count = 28 + Math.floor(Math.random() * 9)

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.22
    const speed = 1.4 + Math.random() * 3.4
    state.sparks.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.5,
      life: 0,
      maxLife: 48 + Math.random() * 36,
      size: 1.4 + Math.random() * 1.8,
      color,
    })
  }
  if (state.sparks.length > 140) {
    state.sparks.splice(0, state.sparks.length - 140)
  }
  state.lastBurstAt = performance.now()
}

export function drawMonetCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  palette: [string, string, string, string],
  isPlaying: boolean,
) {
  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < 5; i++) {
    const angle = phase * (0.14 + i * 0.03) + i * 1.35
    const cx = width * (0.5 + Math.cos(angle) * (0.28 + (i % 2) * 0.08))
    const cy = height * (0.5 + Math.sin(angle * 0.85) * (0.25 + (i % 3) * 0.06))
    const radius = Math.max(width, height) * (0.28 + (i % 2) * 0.12)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
    grad.addColorStop(0, `${palette[i % 4]}50`)
    grad.addColorStop(0.55, `${palette[(i + 1) % 4]}20`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // 底部 48 根动态音频频谱柱
  const bars = 48
  const maxBarH = Math.min(72, height * 0.12)
  const step = width / bars
  const barW = Math.max(2, step * 0.52)
  const ampScale = isPlaying ? 1 : 0.14

  for (let i = 0; i < bars; i++) {
    const norm = i / (bars - 1)
    const envelope = Math.sin(norm * Math.PI)
    const wave =
      0.45 +
      0.32 * Math.sin(phase * 3.1 + i * 0.42) +
      0.23 * Math.cos(phase * 5.2 - i * 0.71)
    const h = Math.max(3, maxBarH * Math.abs(wave) * (0.35 + 0.65 * envelope) * ampScale)
    const x = i * step + (step - barW) / 2
    const y = height - h
    const grad = ctx.createLinearGradient(x, y, x, height)
    grad.addColorStop(0, `${palette[i % 4]}88`)
    grad.addColorStop(1, `${palette[(i + 1) % 4]}18`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(x, y, barW, h, barW / 2)
    ctx.fill()
  }
}

export function drawLumiereCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  state: VisualizerCanvasState,
  palette: [string, string, string, string],
) {
  ctx.clearRect(0, 0, width, height)
  // 顶部左上角斜射 4 道体积光束
  for (let i = 0; i < 4; i++) {
    const sway = Math.sin(phase * (0.28 + i * 0.07) + i * 1.1) * (width * 0.06)
    const topX = width * (0.08 + i * 0.16) + sway * 0.35
    const botX = topX + width * (0.24 + i * 0.05) + sway
    const spreadTop = 36 + i * 14
    const spreadBot = 160 + i * 42

    ctx.beginPath()
    ctx.moveTo(topX - spreadTop, 0)
    ctx.lineTo(topX + spreadTop, 0)
    ctx.lineTo(botX + spreadBot, height)
    ctx.lineTo(botX - spreadBot, height)
    ctx.closePath()

    const grad = ctx.createLinearGradient(topX, 0, botX, height)
    grad.addColorStop(0, `${palette[i % 4]}34`)
    grad.addColorStop(0.6, `${palette[i % 4]}12`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fill()
  }

  for (const p of state.particles) {
    p.x = (p.x + p.vx * 0.9 + width) % width
    p.y = (p.y - p.vy * 0.55 + height) % height
    ctx.fillStyle = `${palette[p.colorIdx]}88`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * 0.65, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawFumeCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  state: VisualizerCanvasState,
  palette: [string, string, string, string],
) {
  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < 4; i++) {
    const cx = width * (0.2 + i * 0.2 + Math.sin(phase * 0.12 + i * 1.6) * 0.08)
    const cy = height * (0.35 + (i % 2) * 0.28 + Math.cos(phase * 0.09 + i) * 0.12)
    const r = Math.max(width, height) * (0.3 + (i % 2) * 0.08)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, `${palette[i % 4]}32`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  for (const p of state.particles) {
    p.x = (p.x + p.vx * 0.7 + width) % width
    p.y = (p.y - p.vy * 0.45 + height) % height
    ctx.fillStyle = `${palette[p.colorIdx]}55`
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.r * 0.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function drawPartitaCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  palette: [string, string, string, string],
) {
  ctx.clearRect(0, 0, width, height)
  for (let i = 0; i < 5; i++) {
    const y = height * (0.16 + i * 0.16) + Math.sin(phase * 0.25 + i) * 14
    const grad = ctx.createLinearGradient(0, y, width, y)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(0.25 + (i % 3) * 0.15, `${palette[i % 4]}26`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, y - 28, width, 56)

    ctx.strokeStyle = `${palette[i % 4]}28`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
}

export function drawHanabiCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  phase: number,
  state: VisualizerCanvasState,
  palette: [string, string, string, string],
  isPlaying: boolean,
) {
  ctx.clearRect(0, 0, width, height)
  if (isPlaying && performance.now() - state.lastBurstAt > 3200 && state.sparks.length < 18) {
    spawnFireworkBurst(state, width, height, palette)
  }

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i]
    s.life += 1
    if (s.life >= s.maxLife) {
      state.sparks.splice(i, 1)
      continue
    }
    s.vx *= 0.985
    s.vy = s.vy * 0.985 + 0.032
    s.x += s.vx
    s.y += s.vy

    const alpha = Math.max(0, 1 - s.life / s.maxLife)
    ctx.globalAlpha = alpha * (0.65 + 0.35 * Math.sin(phase * 12 + i))
    ctx.fillStyle = s.color
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.size * (0.6 + 0.4 * alpha), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}
