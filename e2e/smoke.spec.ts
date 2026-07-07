import { test, expect } from '@playwright/test'
import { BUILD_ID } from '../src/lib/buildInfo'

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

  test('programs page loads', async ({ page }) => {
    await page.goto('/programs')
    await expect(page.locator('main')).toBeVisible()
    await expect(page.locator('main')).not.toBeEmpty()
    await expect(page).toHaveURL(/\/programs/)
  })

  test('language dropdown opens on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')
    const langBtn = page.getByRole('button', { name: /language/i }).first()
    await expect(langBtn).toBeVisible()
    await langBtn.click()
    await expect(page.getByRole('listbox', { name: /language/i })).toBeVisible()
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
})