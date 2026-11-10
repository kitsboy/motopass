import { test, expect } from '@playwright/test'

test.describe('tools guided mobile flow', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('filters, selects one card, links and steps through tools', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Read it yourself' })).toBeVisible()

    await page.getByLabel('Filter tools').fill('NIP-17')
    await expect(page.getByRole('button', { name: /A Nostr DM/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /An invoice/ })).toHaveCount(0)
    await page.getByLabel('Filter tools').fill('')

    await page.getByRole('button', { name: /A Silent Payment/ }).click()
    await expect(page).toHaveURL(/#silent-payments/)
    await expect(page.locator('#silent-payments')).toBeVisible()
    await expect(page.locator('#silent-payments')).toBeInViewport()
    await expect(page.locator('#bolt11')).toBeHidden()
    await expect(page.getByLabel('Tool switcher')).toBeVisible()
    await page.screenshot({ path: 'artifacts/playwright/tools-mobile.png' })
    await expect(page.getByRole('button', { name: /Copy tool link/ }).first()).toBeVisible()

    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page).toHaveURL(/#bolt11/)
    await expect(page.locator('#bolt11')).toBeVisible()
    await expect(page.locator('#silent-payments')).toBeHidden()

    await page.getByRole('button', { name: 'Guide' }).click()
    await expect(page.locator('#bolt11')).toBeVisible()
    await expect(page.locator('#silent-payments')).toBeVisible()
  })
})
