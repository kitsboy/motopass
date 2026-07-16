import { test, expect } from '@playwright/test'
import { BUILD_ID } from '../src/lib/buildInfo'

type FooterGapMetrics = {
  footerDocBottom: number
  navDocBottom: number
  gapBelowFooter: number
  gapBelowDocument: number
  docHeight: number
  bodyOffsetHeight: number
  scrollY: number
}

const MOBILE_TAB_BAR = 'nav.mobile-nav-glass[aria-label="Mobile tab bar"]'

async function scrollToDocumentBottom(page: import('@playwright/test').Page) {
  await page.locator(MOBILE_TAB_BAR).waitFor({ state: 'visible', timeout: 10_000 })
  await page.evaluate(() => {
    window.scrollTo(0, document.documentElement.scrollHeight)
  })
}

async function collectFooterGapMetrics(page: import('@playwright/test').Page): Promise<FooterGapMetrics | null> {
  return page.evaluate((navSelector) => {
    const footerEl = document.querySelector('footer.footer-glass')
    const navEl = document.querySelector(navSelector)
    if (!footerEl || !navEl) return null
    const footerRect = footerEl.getBoundingClientRect()
    const navRect = navEl.getBoundingClientRect()
    const scrollY = window.scrollY
    const docHeight = document.documentElement.scrollHeight
    const navDocBottom = navRect.bottom + scrollY
    return {
      footerDocBottom: footerRect.bottom + scrollY,
      navDocBottom,
      gapBelowFooter: footerRect.bottom - navRect.top,
      gapBelowDocument: docHeight - navDocBottom,
      docHeight,
      bodyOffsetHeight: document.body.offsetHeight,
      scrollY,
    }
  }, MOBILE_TAB_BAR)
}

test.describe('footer gap (layout regression)', () => {
  test('desktop Chrome — scrollHeight equals body offsetHeight', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 })

    const metrics = await page.evaluate(() => ({
      scrollHeight: document.documentElement.scrollHeight,
      bodyOffsetHeight: document.body.offsetHeight,
    }))

    expect(metrics.scrollHeight).toBe(metrics.bodyOffsetHeight)
  })

  test('mobile footer sits flush with tab bar — no document void', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 })

    const footer = page.locator('footer.footer-glass')
    await scrollToDocumentBottom(page)
    await expect(footer).toBeVisible({ timeout: 10_000 })
    await expect(footer.locator('[data-build-version]')).toContainText(BUILD_ID)

    const metrics = await collectFooterGapMetrics(page)

    expect(metrics).not.toBeNull()
    if (metrics) {
      expect(metrics.gapBelowFooter).toBeLessThan(4)
      expect(metrics.gapBelowDocument).toBeLessThan(16)
      expect(metrics.docHeight).toBe(metrics.bodyOffsetHeight)
    }

    const screenshot = await footer.screenshot()
    expect(screenshot.byteLength).toBeGreaterThan(2_000)
  })

  for (const path of ['/', '/verify']) {
    test(`mobile ${path} — zero viewport void below footer`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.locator('main')).toBeVisible({ timeout: 10_000 })

      await scrollToDocumentBottom(page)

      const metrics = await collectFooterGapMetrics(page)
      expect(metrics).not.toBeNull()
      if (metrics) {
        expect(metrics.gapBelowDocument).toBeLessThan(2)
        expect(metrics.gapBelowFooter).toBeLessThan(4)
      }
    })
  }
})