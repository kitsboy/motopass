import type { SavingsRow } from './pitchStats'
import { BUILD_ID } from './buildInfo'

const EXPORT_WIDTH = 1400
const EXPORT_HEIGHT = 1980
const PAD = 64
const LOGO_SRC = '/images/motopass-logo.png'

const COLORS = {
  bgTop: '#08080f',
  bgMid: '#10101a',
  bgBottom: '#0c0c14',
  panel: 'rgba(14, 14, 22, 0.92)',
  panelBorder: 'rgba(255, 255, 255, 0.1)',
  gold: '#ffc46e',
  goldDeep: '#ff9500',
  goldMuted: '#e68600',
  ink: '#ffffff',
  inkMuted: 'rgba(255, 255, 255, 0.68)',
  inkSubtle: 'rgba(255, 255, 255, 0.45)',
  tradBar: 'rgba(148, 148, 168, 0.55)',
  tradBarEnd: 'rgba(148, 148, 168, 0.28)',
  summaryBorder: 'rgba(255, 149, 0, 0.28)',
}

const SUMMARY = [
  { value: '$77,100', label: 'Legal delta' },
  { value: '42', label: 'Days faster' },
  { value: '47', label: 'More jurisdictions' },
] as const

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string | CanvasGradient,
) {
  roundRectPath(ctx, x, y, w, h, r)
  ctx.fillStyle = fill
  ctx.fill()
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  stroke: string,
  lineWidth = 1,
) {
  roundRectPath(ctx, x, y, w, h, r)
  ctx.strokeStyle = stroke
  ctx.lineWidth = lineWidth
  ctx.stroke()
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (typeof Image === 'undefined') return Promise.resolve(null)

  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

function formatRowValue(row: SavingsRow, value: number): string {
  if (row.unit === '$') return `$${value.toLocaleString()}`
  if (row.unit === 'days') return `${value.toLocaleString()} days`
  return value.toLocaleString()
}

function deltaLabel(row: SavingsRow): string {
  if (row.unit === '$') {
    const delta = row.traditional - row.motopass
    return `−$${delta.toLocaleString()} modeled`
  }
  if (row.unit === 'days') {
    const delta = row.traditional - row.motopass
    return `−${delta} days modeled`
  }
  const delta = row.motopass - row.traditional
  return `+${delta} jurisdictions modeled`
}

function drawBackground(ctx: CanvasRenderingContext2D) {
  const gradient = ctx.createLinearGradient(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)
  gradient.addColorStop(0, COLORS.bgTop)
  gradient.addColorStop(0.45, COLORS.bgMid)
  gradient.addColorStop(1, COLORS.bgBottom)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

  const glowA = ctx.createRadialGradient(EXPORT_WIDTH * 0.12, 0, 0, EXPORT_WIDTH * 0.12, 0, EXPORT_WIDTH * 0.55)
  glowA.addColorStop(0, 'rgba(255, 149, 0, 0.14)')
  glowA.addColorStop(1, 'transparent')
  ctx.fillStyle = glowA
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT * 0.45)

  const glowB = ctx.createRadialGradient(EXPORT_WIDTH * 0.88, EXPORT_HEIGHT * 0.2, 0, EXPORT_WIDTH * 0.88, EXPORT_HEIGHT * 0.2, EXPORT_WIDTH * 0.4)
  glowB.addColorStop(0, 'rgba(77, 159, 255, 0.08)')
  glowB.addColorStop(1, 'transparent')
  ctx.fillStyle = glowB
  ctx.fillRect(0, 0, EXPORT_WIDTH, EXPORT_HEIGHT)

  ctx.strokeStyle = 'rgba(255, 149, 0, 0.18)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, 1)
  ctx.lineTo(EXPORT_WIDTH, 1)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, EXPORT_HEIGHT - 1)
  ctx.lineTo(EXPORT_WIDTH, EXPORT_HEIGHT - 1)
  ctx.stroke()
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  logo: HTMLImageElement | null,
) {
  const logoSize = 72
  let textX = PAD

  if (logo) {
    fillRoundRect(ctx, PAD, PAD, logoSize, logoSize, 16, 'rgba(255, 255, 255, 0.05)')
    strokeRoundRect(ctx, PAD, PAD, logoSize, logoSize, 16, 'rgba(255, 149, 0, 0.35)', 1.5)
    ctx.drawImage(logo, PAD + 8, PAD + 8, logoSize - 16, logoSize - 16)
    textX = PAD + logoSize + 22
  }

  ctx.fillStyle = COLORS.gold
  ctx.font = '600 13px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText('MEMBERS · MODELED ECONOMICS', textX, PAD + 18)

  ctx.fillStyle = COLORS.ink
  ctx.font = '700 42px "Inter Tight", system-ui, sans-serif'
  const titleLines = wrapText(ctx, title, EXPORT_WIDTH - textX - PAD)
  titleLines.forEach((line, i) => {
    ctx.fillText(line, textX, PAD + 58 + i * 48)
  })

  const copyY = PAD + 58 + titleLines.length * 48 + 18
  ctx.fillStyle = COLORS.inkMuted
  ctx.font = '400 17px Inter, system-ui, sans-serif'
  const copy =
    'Illustrative sovereign stacking comparison — elite advisory modeling, not a guarantee. Figures shown as exact USD and day counts.'
  wrapText(ctx, copy, EXPORT_WIDTH - PAD * 2).forEach((line, i) => {
    ctx.fillText(line, PAD, copyY + i * 26)
  })

  return copyY + 72
}

function drawSummaryStrip(ctx: CanvasRenderingContext2D, y: number) {
  const h = 108
  const w = EXPORT_WIDTH - PAD * 2

  fillRoundRect(
    ctx,
    PAD,
    y,
    w,
    h,
    20,
    ctx.createLinearGradient(PAD, y, PAD + w, y + h),
  )
  const panelGrad = ctx.createLinearGradient(PAD, y, PAD + w, y + h)
  panelGrad.addColorStop(0, 'rgba(255, 149, 0, 0.12)')
  panelGrad.addColorStop(0.55, 'rgba(14, 14, 22, 0.95)')
  panelGrad.addColorStop(1, 'rgba(14, 14, 22, 0.95)')
  fillRoundRect(ctx, PAD, y, w, h, 20, panelGrad)
  strokeRoundRect(ctx, PAD, y, w, h, 20, COLORS.summaryBorder, 1.5)

  const colW = w / 3
  SUMMARY.forEach((item, i) => {
    const cx = PAD + colW * i + colW / 2
    ctx.textAlign = 'center'
    ctx.fillStyle = COLORS.gold
    ctx.font = '700 34px "Inter Tight", system-ui, sans-serif'
    ctx.fillText(item.value, cx, y + 48)
    ctx.fillStyle = COLORS.inkSubtle
    ctx.font = '600 11px "IBM Plex Mono", ui-monospace, monospace'
    ctx.fillText(item.label.toUpperCase(), cx, y + 78)
    ctx.textAlign = 'left'

    if (i > 0) {
      const dividerX = PAD + colW * i
      const grad = ctx.createLinearGradient(dividerX, y + 20, dividerX, y + h - 20)
      grad.addColorStop(0, 'transparent')
      grad.addColorStop(0.5, 'rgba(255, 149, 0, 0.35)')
      grad.addColorStop(1, 'transparent')
      ctx.strokeStyle = grad
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(dividerX, y + 22)
      ctx.lineTo(dividerX, y + h - 22)
      ctx.stroke()
    }
  })

  return y + h + 28
}

function drawHorizontalBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  value: number,
  max: number,
  tone: 'traditional' | 'motopass',
) {
  const trackH = 12
  const fillW = Math.max(width * 0.06, (value / max) * width)

  fillRoundRect(ctx, x, y, width, trackH, trackH / 2, 'rgba(255, 255, 255, 0.06)')
  strokeRoundRect(ctx, x, y, width, trackH, trackH / 2, 'rgba(255, 255, 255, 0.05)', 1)

  const barGrad =
    tone === 'motopass'
      ? (() => {
          const g = ctx.createLinearGradient(x, y, x + fillW, y)
          g.addColorStop(0, COLORS.goldMuted)
          g.addColorStop(0.45, COLORS.goldDeep)
          g.addColorStop(1, COLORS.gold)
          return g
        })()
      : (() => {
          const g = ctx.createLinearGradient(x, y, x + fillW, y)
          g.addColorStop(0, COLORS.tradBar)
          g.addColorStop(1, COLORS.tradBarEnd)
          return g
        })()

  fillRoundRect(ctx, x, y, fillW, trackH, trackH / 2, barGrad)

  if (tone === 'motopass') {
    ctx.save()
    roundRectPath(ctx, x, y, fillW, trackH, trackH / 2)
    ctx.clip()
    const shimmer = ctx.createLinearGradient(x, y, x + fillW, y)
    shimmer.addColorStop(0, 'transparent')
    shimmer.addColorStop(0.45, 'rgba(255, 255, 255, 0.28)')
    shimmer.addColorStop(0.9, 'transparent')
    ctx.fillStyle = shimmer
    ctx.fillRect(x, y, fillW, trackH)
    ctx.restore()
  }
}

function drawMetricPanel(
  ctx: CanvasRenderingContext2D,
  row: SavingsRow,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  fillRoundRect(ctx, x, y, w, h, 20, COLORS.panel)
  strokeRoundRect(ctx, x, y, w, h, 20, COLORS.panelBorder, 1)

  const innerX = x + 22
  const innerW = w - 44

  ctx.fillStyle = COLORS.ink
  ctx.font = '700 20px "Inter Tight", system-ui, sans-serif'
  ctx.fillText(row.label, innerX, y + 36)

  const badge = deltaLabel(row)
  const badgeW = ctx.measureText(badge).width + 28
  fillRoundRect(ctx, innerX, y + 48, badgeW, 26, 13, 'rgba(255, 149, 0, 0.12)')
  strokeRoundRect(ctx, innerX, y + 48, badgeW, 26, 13, 'rgba(255, 149, 0, 0.28)', 1)
  ctx.fillStyle = COLORS.gold
  ctx.font = '600 10px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText(badge.toUpperCase(), innerX + 14, y + 66)

  const tradVal = formatRowValue(row, row.traditional)
  const motoVal = formatRowValue(row, row.motopass)
  const numbersY = y + 118

  ctx.fillStyle = COLORS.inkSubtle
  ctx.font = '600 10px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText('TRADITIONAL', innerX, numbersY)
  ctx.textAlign = 'right'
  ctx.fillText('MOTOPASS', x + w - 22, numbersY)
  ctx.textAlign = 'left'

  ctx.font = '700 30px "Inter Tight", system-ui, sans-serif'
  ctx.fillStyle = 'rgba(196, 196, 212, 0.9)'
  ctx.fillText(tradVal, innerX, numbersY + 38)
  ctx.textAlign = 'right'
  ctx.fillStyle = COLORS.gold
  ctx.fillText(motoVal, x + w - 22, numbersY + 38)
  ctx.textAlign = 'left'

  const max = Math.max(row.traditional, row.motopass, 1)
  const chartY = y + h - 118

  ctx.fillStyle = COLORS.inkSubtle
  ctx.font = '600 9px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText('TRADITIONAL', innerX, chartY)
  ctx.textAlign = 'right'
  ctx.fillStyle = COLORS.gold
  ctx.fillText(tradVal, x + w - 22, chartY)
  ctx.textAlign = 'left'
  drawHorizontalBar(ctx, innerX, chartY + 10, innerW, row.traditional, max, 'traditional')

  ctx.fillStyle = COLORS.inkSubtle
  ctx.font = '600 9px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText('MOTOPASS', innerX, chartY + 44)
  ctx.textAlign = 'right'
  ctx.fillStyle = COLORS.gold
  ctx.fillText(motoVal, x + w - 22, chartY + 44)
  ctx.textAlign = 'left'
  drawHorizontalBar(ctx, innerX, chartY + 54, innerW, row.motopass, max, 'motopass')
}

function drawFooter(ctx: CanvasRenderingContext2D, y: number) {
  ctx.fillStyle = COLORS.inkSubtle
  ctx.font = '400 13px "IBM Plex Mono", ui-monospace, monospace'
  const footnote =
    'Modeled for member evaluation only. Traditional advisory assumes boutique counsel across three jurisdictions; MotoPass reflects platform-modeled stack economics at current program depth.'
  wrapText(ctx, footnote, EXPORT_WIDTH - PAD * 2).forEach((line, i) => {
    ctx.fillText(line, PAD, y + i * 20)
  })

  const metaY = y + 56
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.font = '500 12px "IBM Plex Mono", ui-monospace, monospace'
  ctx.fillText('motopass.giveabit.io', PAD, metaY)
  ctx.textAlign = 'right'
  ctx.fillText(`BUILD ${BUILD_ID}`, EXPORT_WIDTH - PAD, metaY)
  ctx.textAlign = 'left'
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''

  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines.length ? lines : [text]
}

/** Premium dark canvas export matching the live savings dashboard v3. */
export async function drawSavingsGraphCanvas(
  rows: SavingsRow[],
  title: string,
  canvas = document.createElement('canvas'),
): Promise<HTMLCanvasElement> {
  canvas.width = EXPORT_WIDTH
  canvas.height = EXPORT_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx || !rows.length) return canvas

  const logo = await loadImage(LOGO_SRC)
  drawBackground(ctx)
  const panelsY = drawSummaryStrip(ctx, drawHeader(ctx, title, logo))

  const gap = 20
  const panelW = (EXPORT_WIDTH - PAD * 2 - gap * (rows.length - 1)) / rows.length
  const panelH = 430

  rows.forEach((row, i) => {
    const x = PAD + i * (panelW + gap)
    drawMetricPanel(ctx, row, x, panelsY, panelW, panelH)
  })

  drawFooter(ctx, panelsY + panelH + 36)
  return canvas
}

function canvasToJpegBytes(canvas: HTMLCanvasElement, quality = 0.94): Promise<Uint8Array | null> {
  return new Promise(resolve => {
    canvas.toBlob(
      async blob => {
        if (!blob) {
          resolve(null)
          return
        }
        resolve(new Uint8Array(await blob.arrayBuffer()))
      },
      'image/jpeg',
      quality,
    )
  })
}

function buildPdfFromJpeg(jpeg: Uint8Array, imgWidth: number, imgHeight: number): Uint8Array {
  const pageW = 595.28
  const pageH = 841.89
  const margin = 28
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2
  const scale = Math.min(maxW / imgWidth, maxH / imgHeight)
  const drawW = imgWidth * scale
  const drawH = imgHeight * scale
  const drawX = (pageW - drawW) / 2
  const drawY = pageH - margin - drawH

  const enc = new TextEncoder()
  const chunks: Uint8Array[] = []
  let offset = 0
  const objOffsets: number[] = []

  const append = (text: string) => {
    const bytes = enc.encode(text)
    chunks.push(bytes)
    offset += bytes.length
  }

  const appendBinary = (bytes: Uint8Array) => {
    chunks.push(bytes)
    offset += bytes.length
  }

  const reserveObject = () => {
    objOffsets.push(offset)
    return objOffsets.length
  }

  append('%PDF-1.4\n')

  const catalogNum = reserveObject()
  append(`${catalogNum} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`)

  const pagesNum = reserveObject()
  append(`${pagesNum} 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`)

  const pageNum = reserveObject()
  append(
    `${pageNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /XObject << /Im1 5 0 R >> >> >>\nendobj\n`,
  )

  const content = `q\n${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} ${drawX.toFixed(2)} ${drawY.toFixed(2)} cm\n/Im1 Do\nQ\n`
  const contentNum = reserveObject()
  append(`${contentNum} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`)

  const imageNum = reserveObject()
  append(
    `${imageNum} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidth} /Height ${imgHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`,
  )
  appendBinary(jpeg)
  append('\nendstream\nendobj\n')

  const xrefStart = offset
  append('xref\n')
  append(`0 ${objOffsets.length + 1}\n`)
  append('0000000000 65535 f \n')
  for (const objOffset of objOffsets) {
    append(`${String(objOffset).padStart(10, '0')} 00000 n \n`)
  }
  append('trailer\n')
  append(`<< /Size ${objOffsets.length + 1} /Root 1 0 R >>\n`)
  append('startxref\n')
  append(`${xrefStart}\n`)
  append('%%EOF')

  const total = chunks.reduce((sum, c) => sum + c.length, 0)
  const out = new Uint8Array(total)
  let pos = 0
  for (const chunk of chunks) {
    out.set(chunk, pos)
    pos += chunk.length
  }
  return out
}

export async function savingsGraphToPngBlob(
  rows: SavingsRow[],
  title: string,
): Promise<Blob | null> {
  const canvas = await drawSavingsGraphCanvas(rows, title)
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/png')
  })
}

export async function savingsGraphToPdfBlob(
  rows: SavingsRow[],
  title: string,
): Promise<Blob | null> {
  const canvas = await drawSavingsGraphCanvas(rows, title)
  const jpeg = await canvasToJpegBytes(canvas)
  if (!jpeg) return null
  const pdfBytes = buildPdfFromJpeg(jpeg, canvas.width, canvas.height)
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

/** Download premium modeled savings chart as print-ready PDF. */
export async function downloadSavingsGraph(rows: SavingsRow[], title: string): Promise<boolean> {
  const blob = await savingsGraphToPdfBlob(rows, title)
  if (!blob) return false

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'motopass-savings-modeled.pdf'
  a.click()
  URL.revokeObjectURL(url)
  return true
}

/** @deprecated Use downloadSavingsGraph — kept for compatibility */
export const downloadSavingsGraphPng = downloadSavingsGraph