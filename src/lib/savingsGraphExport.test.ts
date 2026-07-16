import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SavingsRow } from './pitchStats'
import { drawSavingsGraphCanvas, savingsGraphToPngBlob } from './savingsGraphExport'

const ROWS: SavingsRow[] = [
  { label: 'Advisory fees', traditional: 12000, motopass: 2400, unit: '$' },
  { label: 'Processing', traditional: 180, motopass: 45, unit: 'days' },
]

class MockCanvas {
  width = 0
  height = 0

  getContext() {
    return {
      fillStyle: '',
      font: '',
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      arcTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      strokeStyle: '',
      stroke: vi.fn(),
    }
  }

  toBlob(cb: (blob: Blob | null) => void) {
    cb(new Blob(['png'], { type: 'image/png' }))
  }
}

beforeEach(() => {
  vi.stubGlobal('document', {
    createElement: () => new MockCanvas(),
  })
})

describe('savingsGraphExport', () => {
  it('draws savings graph canvas (822)', () => {
    const canvas = drawSavingsGraphCanvas(ROWS, 'Test savings')
    expect(canvas.width).toBeGreaterThan(0)
    expect(canvas.height).toBeGreaterThan(0)
  })

  it('exports canvas to PNG blob stub (822)', async () => {
    const blob = await savingsGraphToPngBlob(ROWS, 'Test savings')
    expect(blob).not.toBeNull()
    expect(blob?.type).toBe('image/png')
  })
})