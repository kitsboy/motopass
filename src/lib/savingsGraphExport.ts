import type { SavingsRow } from './pitchStats'

const CANVAS_WIDTH = 960
const CANVAS_HEIGHT = 520
const PAD = 48

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Canvas-to-blob PNG export stub for pitch savings graphs (item 822). */
export function drawSavingsGraphCanvas(
  rows: SavingsRow[],
  title: string,
  canvas = document.createElement('canvas'),
): HTMLCanvasElement {
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx || !rows.length) return canvas

  ctx.fillStyle = '#f8f6f2'
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.fillStyle = '#1a1a1a'
  ctx.font = '600 22px system-ui, sans-serif'
  ctx.fillText(title, PAD, PAD)

  ctx.fillStyle = '#6b6b6b'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('MotoPass · modeled savings · export stub', PAD, PAD + 22)

  const cardW = (CANVAS_WIDTH - PAD * 2 - 24) / rows.length
  const baseY = CANVAS_HEIGHT - PAD
  const chartH = 280

  rows.forEach((row, i) => {
    const x = PAD + i * (cardW + 12)
    const max = Math.max(row.traditional, row.motopass, 1)

    drawRoundedRect(ctx, x, PAD + 48, cardW, chartH + 56, 12)
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.strokeStyle = '#e8e4dc'
    ctx.stroke()

    ctx.fillStyle = '#1a1a1a'
    ctx.font = '600 13px system-ui, sans-serif'
    const label = row.label.length > 18 ? `${row.label.slice(0, 16)}…` : row.label
    ctx.fillText(label, x + 14, PAD + 72)

    const barW = (cardW - 56) / 2
    const tradH = Math.max(12, (row.traditional / max) * (chartH - 40))
    const motoH = Math.max(12, (row.motopass / max) * (chartH - 40))

    ctx.fillStyle = '#b8b8b8'
    ctx.fillRect(x + 18, baseY - tradH, barW, tradH)
    ctx.fillStyle = '#f7931a'
    ctx.fillRect(x + 18 + barW + 8, baseY - motoH, barW, motoH)

    ctx.fillStyle = '#6b6b6b'
    ctx.font = '10px system-ui, sans-serif'
    ctx.fillText('Trad.', x + 18, baseY + 14)
    ctx.fillStyle = '#c45f00'
    ctx.fillText('MotoPass', x + 18 + barW + 8, baseY + 14)
  })

  return canvas
}

export function savingsGraphToPngBlob(
  rows: SavingsRow[],
  title: string,
): Promise<Blob | null> {
  const canvas = drawSavingsGraphCanvas(rows, title)
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png')
  })
}

export async function downloadSavingsGraphPng(rows: SavingsRow[], title: string): Promise<boolean> {
  const blob = await savingsGraphToPngBlob(rows, title)
  if (!blob) return false

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'motopass-savings-graph.png'
  a.click()
  URL.revokeObjectURL(url)
  return true
}