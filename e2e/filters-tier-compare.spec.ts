import { test, expect } from '@playwright/test'

/** Lazy routes need domcontentloaded + content wait (not full load). */
const gotoOpts = { waitUntil: 'domcontentloaded' as const }

test.describe('Programs quick filters', () => {
  test('BTC-friendly tier chip filters rows, shows its count, and syncs the URL', async ({ page }) => {
    const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/programs', gotoOpts)
    await data.catch(() => {})
    await expect(page.locator('input[type="search"]').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20_000 })

    const rows = page.locator('tbody tr')
    const totalRows = await rows.count()
    expect(totalRows).toBeGreaterThan(0)

    // The chip carries a live count of matching programs (from curated research
    // flags, not a score threshold) and is rendered as an aria-pressed toggle.
    const friendly = page.getByRole('button', { name: /BTC-friendly highlight/i })
    await expect(friendly).toBeVisible()
    await expect(friendly).toHaveAttribute('aria-pressed', 'false')
    const countText = await friendly.locator('span').last().textContent()
    const friendlyCount = Number(countText?.trim() ?? '0')
    expect(friendlyCount).toBeGreaterThan(0)

    await friendly.click()
    await expect(friendly).toHaveAttribute('aria-pressed', 'true')
    await expect(page).toHaveURL(/btcTier=friendly/, { timeout: 10_000 })
    await expect(rows).toHaveCount(friendlyCount, { timeout: 10_000 })

    // Toggle off restores the full corpus and clears the URL param.
    await friendly.click()
    await expect(friendly).toHaveAttribute('aria-pressed', 'false')
    await expect(page).not.toHaveURL(/btcTier=/)
    await expect(rows).toHaveCount(totalRows, { timeout: 10_000 })
  })

  test('BTC-policy tier chip filters independently and deep-links from the URL', async ({ page }) => {
    const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/programs?btcTier=policy', gotoOpts)
    await data.catch(() => {})
    await expect(page.locator('input[type="search"]').first()).toBeVisible({ timeout: 20_000 })

    // Deep link: chip starts pressed and rows are pre-filtered.
    const policy = page.getByRole('button', { name: /BTC in policy/i })
    await expect(policy).toBeVisible({ timeout: 15_000 })
    await expect(policy).toHaveAttribute('aria-pressed', 'true')
    const countText = await policy.locator('span').last().textContent()
    const policyCount = Number(countText?.trim() ?? '0')
    expect(policyCount).toBeGreaterThan(0)
    await expect(page.locator('tbody tr')).toHaveCount(policyCount, { timeout: 10_000 })

    // Tiers are independent curated flags: switching to friendly must not keep
    // policy rows (they may overlap, so we compare against the friendly count).
    const friendly = page.getByRole('button', { name: /BTC-friendly highlight/i })
    await friendly.click()
    await expect(policy).toHaveAttribute('aria-pressed', 'false')
    await expect(page).toHaveURL(/btcTier=friendly/)
    const friendlyCount = Number((await friendly.locator('span').last().textContent())?.trim() ?? '0')
    await expect(page.locator('tbody tr')).toHaveCount(friendlyCount, { timeout: 10_000 })
  })
})

test.describe('Compare picker filter', () => {
  test('searching the picker narrows options and selecting swaps into the matrix', async ({ page }) => {
    const data = page.waitForResponse(r => /countries\.json/.test(r.url()) && r.ok(), { timeout: 20_000 })
    await page.goto('/compare', gotoOpts)
    await data.catch(() => {})
    await expect(page.getByRole('table', { name: 'Side-by-side comparison' })).toBeVisible({ timeout: 20_000 })

    const search = page.locator('#compare-search')
    await search.click()
    // Default pair (Uruguay + Portugal) is already in the matrix.
    const table = page.getByRole('table', { name: 'Side-by-side comparison' })
    await expect(table.getByRole('columnheader', { name: /Uruguay/ })).toBeVisible()

    // Type to narrow the combobox listbox, then pick a different country.
    await search.fill('Mexico')
    const option = page.getByRole('option', { name: /Mexico/ }).first()
    await expect(option).toBeVisible()
    await option.click()

    await expect(page).toHaveURL(/ids=/)
    await expect(table.getByRole('columnheader', { name: /Mexico/ })).toBeVisible({ timeout: 10_000 })

    // Removing it via the chip's remove button restores the default pair shape.
    await page.getByRole('button', { name: /Remove Mexico/ }).click()
    await expect(table.getByRole('columnheader', { name: /Mexico/ })).toHaveCount(0, { timeout: 10_000 })
  })
})
