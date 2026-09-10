import { test } from '@playwright/test'
import { BUILD_ID } from '../src/lib/buildInfo'

test('debug BUILD id sources', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)
  const footerText = await page.evaluate(() => {
    const el = document.querySelector('[data-build-version]')
    return el ? el.textContent : 'NO ELEMENT'
  })
  const hasFooter = await page.evaluate(() => !!document.querySelector('footer.footer-glass'))
  console.log(`IMPORTED_BUILD_ID=${BUILD_ID}`)
  console.log(`FOOTER_TEXT=${footerText}`)
  console.log(`HAS_SHARED_FOOTER=${hasFooter}`)
})
