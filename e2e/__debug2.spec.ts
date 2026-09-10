import { test } from '@playwright/test'

test('debug Uruguay modal tabs', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/programs', { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000)
  const matches = await page.getByText('Uruguay', { exact: true }).all()
  console.log(`URUGUAY_MATCHES=${matches.length}`)
  for (let i = 0; i < matches.length; i++) {
    const tag = await matches[i].evaluate(el => `${el.tagName}.${el.className}`.slice(0, 90))
    const vis = await matches[i].isVisible()
    console.log(`MATCH[${i}] visible=${vis} ${tag}`)
  }
  await matches[0].click()
  await page.waitForTimeout(1500)
  const modalText = await page.evaluate(() => {
    const dlg = document.querySelector('[role="dialog"], .classy-modal, [data-modal]')
    if (!dlg) return 'NO DIALOG ELEMENT'
    return dlg.textContent?.slice(0, 500)
  })
  console.log(`AFTER_CLICK_0=${modalText}`)
})
