import { test, expect } from '@playwright/test'
import { BUILD_ID } from '../src/lib/buildInfo'

/** Lazy routes need domcontentloaded + content wait (not full load). */
const gotoOpts = { waitUntil: 'domcontentloaded' as const }

test.describe('smoke', () => {
  test('home loads with hero headline', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('.hero-headline')).toBeVisible()
    await expect(page.locator('.hero-headline')).not.toBeEmpty()
  })

  test('BUILD version is visible in chrome or footer', async ({ page }) => {
    await page.goto('/')
    const build = page.getByText(`BUILD ${BUILD_ID}`, { exact: false }).first()
    await build.scrollIntoViewIfNeeded()
    await expect(build).toBeVisible()
  })

  test('btcmap page loads with program selector', async ({ page }) => {
    const chunk = page.waitForResponse(r => /BtcMapPage-.*\.js/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/btcmap', gotoOpts)
    await chunk.catch(() => {})
    await expect(page.locator('#btcmap-program')).toBeVisible({ timeout: 20_000 })
  })

  test('programs page loads', async ({ page }) => {
    const chunk = page.waitForResponse(r => /ProgramsPage-.*\.js/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/programs', gotoOpts)
    await chunk.catch(() => {})
    await expect(page.locator('input[type="search"]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page).toHaveURL(/\/programs/)
  })

  test('language dropdown opens on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const langBtn = page.getByRole('button', { name: /language/i }).first()
    await expect(langBtn).toBeVisible()
    await langBtn.click()
    const listbox = page.getByRole('listbox', { name: /language/i })
    await expect(listbox).toBeVisible()
    for (const name of ['Español', 'Français', 'Português', '中文', 'العربية', 'Kiswahili', 'Deutsch', 'हिन्दी']) {
      await expect(listbox.getByRole('option', { name })).toBeVisible()
    }
  })

  test('language switch updates document lang', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const langBtn = page.getByRole('button', { name: /language/i }).first()
    await langBtn.click()
    await page.getByRole('option').filter({ hasText: 'Español' }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
  })

  test('theme toggle switches dark class', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const toggle = page.getByRole('button', { name: /switch to (light|dark) mode/i })
    await expect(toggle).toBeVisible()

    const before = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    await toggle.click()
    const after = await page.evaluate(() => document.documentElement.classList.contains('dark'))
    expect(after).toBe(!before)

    const stored = await page.evaluate(() => localStorage.getItem('motopass-theme'))
    expect(stored).toBe(after ? 'dark' : 'light')
  })

  test('compare empty state loads', async ({ page }) => {
    await page.addInitScript(() => localStorage.removeItem('motopass-compare-ids'))
    const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/compare', gotoOpts)
    await data.catch(() => {})
    await expect(page.getByText(/select programs to compare/i)).toBeVisible({ timeout: 20_000 })
  })

  test('mobile bottom nav and more sheet', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const more = page.getByRole('button', { name: /more/i })
    await expect(more).toBeVisible()
    await more.click()
    await expect(page.getByRole('dialog', { name: /more/i })).toBeVisible()
  })

  test('compare URL preserves selected ids', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/compare?ids=1,2', gotoOpts)
    await data.catch(() => {})
    const compareTable = page.getByRole('table', { name: 'Side-by-side comparison' })
    await expect(compareTable).toBeVisible({ timeout: 20_000 })
    await expect(compareTable.locator('thead th')).toHaveCount(3)
  })

  test('programs URL filter shows in search', async ({ page }) => {
    await page.goto('/programs?q=Uruguay', gotoOpts)
    const search = page.locator('input[type="search"]').first()
    await expect(search).toBeVisible({ timeout: 15_000 })
    await expect(search).toHaveValue('Uruguay')
  })

  test('simulator URL restores program selection', async ({ page }) => {
    await page.goto('/simulator?programs=1,4', gotoOpts)
    await expect(page.locator('#sim-p-1')).toBeChecked({ timeout: 15_000 })
    await expect(page.locator('#sim-p-4')).toBeChecked()
  })

  test('verify generates 64-char hash', async ({ page }) => {
    await page.goto('/verify', gotoOpts)
    await page.getByRole('button', { name: /generate sha-256 hash/i }).click()
    const code = page.locator('code').first()
    await expect(code).toBeVisible()
    const text = await code.textContent()
    expect(text?.trim()).toMatch(/^[a-f0-9]{64}$/)
  })

  test('404 page has noindex meta', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz', gotoOpts)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/, { timeout: 10_000 })
  })

  test('Arabic sets RTL document direction', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const langBtn = page.getByRole('button', { name: /language/i }).first()
    await langBtn.click()
    await page.getByRole('option').filter({ hasText: 'العربية' }).click()
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar')
  })

  test('Uruguay flagship modal shows Pathways tab when visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/programs', gotoOpts)
    await expect(page.locator('input[type="search"]').first()).toBeVisible({ timeout: 15_000 })
    const uruguay = page.getByText('Uruguay', { exact: true }).first()
    if (await uruguay.isVisible()) {
      await uruguay.click()
      await expect(page.getByText('Pathways')).toBeVisible()
    }
  })

  test('dashboard redirects logged-out users to register with next', async ({ page }) => {
    await page.goto('/dashboard?next=/profile', gotoOpts)
    await expect(page).toHaveURL(/\/register\?next=%2Fprofile/, { timeout: 15_000 })
  })

  test('apply page loads with launch scorecard', async ({ page }) => {
    await page.goto('/apply', gotoOpts)
    await expect(page.getByText(/launch gate scorecard/i)).toBeVisible({ timeout: 15_000 })
  })

  test('mobile viewport has no horizontal overflow on home', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })

  test('mobile viewport has no horizontal overflow on programs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/programs', gotoOpts)
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })

  test('mobile viewport has no horizontal overflow on compare', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/compare', gotoOpts)
    await expect(page.locator('main')).toBeVisible({ timeout: 15_000 })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    expect(overflow).toBe(false)
  })
})