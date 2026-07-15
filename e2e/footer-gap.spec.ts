import { test, expect } from '@playwright/test'
import { BUILD_ID } from '../src/lib/buildInfo'

/**
 * Visual regression stub — footer/mobile gap layout on narrow viewport.
 * Baseline screenshots are optional; test asserts layout invariants + captures stub.
 */
test.describe('footer gap (visual stub)', () => {
  test('mobile footer sits flush with tab bar — no document void', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/verify', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible()

    const footer = page.locator('footer.footer-glass')
    await page.evaluate(() => {
      document.querySelector('footer.footer-glass')?.scrollIntoView({ block: 'end', behavior: 'instant' })
    })
    await expect(footer).toBeVisible({ timeout: 10_000 })
    await expect(footer.getByText(`BUILD ${BUILD_ID}`, { exact: false })).toBeVisible()

    const metrics = await page.evaluate(() => {
      const footerEl = document.querySelector('footer.footer-glass')
      const navEl = document.querySelector('.mobile-nav-glass')
      if (!footerEl || !navEl) return null
      const footerRect = footerEl.getBoundingClientRect()
      const navRect = navEl.getBoundingClientRect()
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight
      const footerDocBottom = footerRect.bottom + scrollY
      return {
        footerBottom: footerDocBottom,
        navTop: navRect.top,
        gapBelowFooter: docHeight - footerDocBottom,
        docHeight,
        scrollY,
      }
    })

    expect(metrics).not.toBeNull()
    if (metrics) {
      expect(metrics.gapBelowFooter).toBeLessThan(16)
      expect(metrics.footerBottom).toBeGreaterThanOrEqual(metrics.navTop - 4)
    }

    const screenshot = await footer.screenshot()
    expect(screenshot.byteLength).toBeGreaterThan(2_000)
  })
})