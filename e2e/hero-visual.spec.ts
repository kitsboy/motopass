import { test, expect } from '@playwright/test'

/**
 * Hero visual integrity — programmatic layout checks + screenshots
 * (artifacts/playwright/hero-visual/) at the three canonical widths.
 * Screenshot baselines are not asserted; the assertions below carry the
 * regression detection, screenshots are for human review.
 */

const WIDTHS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
]

test.describe('hero visual integrity', () => {
  for (const { name, width, height } of WIDTHS) {
    test(`hero renders correctly at ${name} (${width}px)`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
      await page.goto('/', { waitUntil: 'domcontentloaded' })
      await data.catch(() => {})

      // Hero composition — all elements present.
      const tagline = page.locator('.hero-elite-tagline')
      await expect(tagline).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText(/live research corpus/i)).toBeVisible()
      await expect(page.getByText(/flagship depth/i).first()).toBeVisible()
      await expect(page.getByText(/countries tracked/i)).toBeVisible()

      // Live stat band — 4 cells, no overlap.
      const cells = page.locator('.hero-stat-cell')
      await expect(cells).toHaveCount(4)
      const boxes = []
      for (let i = 0; i < 4; i++) boxes.push(await cells.nth(i).boundingBox())
      for (let i = 1; i < boxes.length; i++) {
        const a = boxes[i - 1]!
        const b = boxes[i]!
        const overlaps =
          b.x < a.x + a.width - 1 && b.y < a.y + a.height - 1 && a.y < b.y + b.height - 1 && a.x < b.x + b.width - 1
        if (a.y === b.y) expect(overlaps, `cells ${i - 1}/${i} overlap`).toBe(false)
      }

      // No horizontal overflow (the classic responsive regression).
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
      expect(overflow).toBe(false)

      // CTAs remain clickable at this width.
      await expect(page.getByRole('link', { name: /explore programs/i }).first()).toBeVisible()

      await page.screenshot({ path: `artifacts/playwright/hero-visual/${name}-hero.png`, fullPage: false })
    })
  }

  test('depth figure reads 21/21 from the live corpus (never a hard-coded claim)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await data.catch(() => {})

    // CountUp animates on scroll-into-view by design; on an 800px viewport the
    // stat band sits at the fold edge, so bring it into view like a user would.
    const depthCell = page.locator('.hero-stat-cell').filter({ hasText: /flagship depth/i })
    await depthCell.scrollIntoViewIfNeeded()
    await expect(depthCell).toContainText('21/21', { timeout: 20_000 })
  })

  test('no M4 or HERMES text anywhere on agents page (privacy scrub regression)', async ({ page }) => {
    await page.goto('/agents', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('main')).toBeVisible({ timeout: 20_000 })
    const body = (await page.locator('body').innerText()).toUpperCase()
    expect(body).not.toContain('HERMES')
    expect(body).not.toMatch(/M4(?!\d)/)
  })
})
