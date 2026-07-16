import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SavingsRow } from './pitchStats'
import {
  drawSavingsGraphCanvas,
  savingsGraphToPdfBlob,
  savingsGraphToPngBlob,
} from './savingsGraphExport'

const ROWS: SavingsRow[] = [
  { label: 'Legal & advisory', traditional: 81_000, motopass: 3_900, unit: '$' },
  { label: 'Time to approval', traditional: 177, motopass: 135, unit: 'days' },
  { label: 'Jurisdictions', traditional: 3, motopass: 50, unit: 'programs' },
]

class MockCanvas {
  width = 0
  height = 0

  getContext() {
    const gradient = { addColorStop: vi.fn() }
    return {
      fillStyle: '',
      strokeStyle: '',
      font: '',
      lineWidth: 1,
      textAlign: 'left' as CanvasTextAlign,
      fillRect: vi.fn(),
      fillText: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      arcTo: vi.fn(),
      closePath: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn((text: string) => ({ width: text.length * 6 })),
      createLinearGradient: vi.fn(() => gradient),
      createRadialGradient: vi.fn(() => gradient),
      save: vi.fn(),
      restore: vi.fn(),
      clip: vi.fn(),
    }
  }

  toBlob(cb: (blob: Blob | null) => void, type?: string) {
    const mime = type ?? 'image/png'
    cb(new Blob([mime === 'application/pdf' ? '%PDF-1.4' : 'png'], { type: mime }))
  }
}

beforeEach(() => {
  vi.stubGlobal('document', {
    createElement: () => new MockCanvas(),
  })
  vi.stubGlobal('Image', class {
    crossOrigin = ''
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    set src(_value: string) {
      queueMicrotask(() => this.onload?.())
    }
  })
})

describe('savingsGraphExport', () => {
  it('draws premium savings dashboard canvas (822)', async () => {
    const canvas = await drawSavingsGraphCanvas(ROWS, 'Cost & time, modeled — not promised')
    expect(canvas.width).toBe(1400)
    expect(canvas.height).toBe(1980)
  })

  it('exports canvas to PNG blob (822)', async () => {
    const blob = await savingsGraphToPngBlob(ROWS, 'Cost & time, modeled — not promised')
    expect(blob).not.toBeNull()
    expect(blob?.type).toBe('image/png')
  })

  it('exports premium chart to PDF blob', async () => {
    const blob = await savingsGraphToPdfBlob(ROWS, 'Cost & time, modeled — not promised')
    expect(blob).not.toBeNull()
    expect(blob?.type).toBe('application/pdf')
    const header = await blob!.slice(0, 8).text()
    expect(header.startsWith('%PDF-1.4')).toBe(true)
  })
})