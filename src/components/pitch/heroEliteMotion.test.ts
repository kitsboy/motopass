import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(import.meta.dirname, '../../..')

describe('elite hero motion (BUILD regression)', () => {
  it('HeroMotionBackground always applies Ken Burns + fog animate classes', () => {
    const src = readFileSync(resolve(root, 'src/components/pitch/HeroMotionBackground.tsx'), 'utf8')
    expect(src).toContain('hero-elite-photo--animate')
    expect(src).toContain('hero-elite-fog--animate-a')
    expect(src).toContain('hero-elite-fog--animate-b')
    expect(src).not.toMatch(/import\s+.*useReducedMotion/)
    expect(src).not.toContain('hero-elite-fog--static')
    expect(src).not.toContain('motion/img')
  })

  it('index.css defines aggressive Ken Burns and fog keyframes', () => {
    const css = readFileSync(resolve(root, 'src/index.css'), 'utf8')
    expect(css).toContain('@keyframes hero-elite-kenburns')
    expect(css).toContain('@keyframes hero-elite-fog-a')
    expect(css).toContain('@keyframes hero-elite-fog-b')
    expect(css).toContain('scale(1.18)')
    expect(css).toContain('translate3d(-14%')
    expect(css).toContain('hero-elite-kenburns-reduced')
    expect(css).not.toMatch(
      /prefers-reduced-motion:[\s\S]*?\.hero-elite-fog--animate-a\s*\{[^}]*animation:\s*none/,
    )
  })
})