import { test, expect } from '@playwright/test'
import { BUILD_ID } from '../src/lib/buildInfo'

test.describe('smoke', () => {
  test('home loads with hero headline', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('.hero-headline')).toBeVisible()
    await expect(page.locator('.hero-headline')).not.toBeEmpty()
  })

  test('footer BUILD version is visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText(`BUILD ${BUILD_ID}`, { exact: false })).toBeVisible()
  })

  test('programs page loads', async ({ page }) => {
    await page.goto('/programs')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('main')).not.toBeEmpty()
    await expect(page).toHaveURL(/\/programs/)
  })

  test('theme toggle switches dark class', async ({ page }) => {
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
})