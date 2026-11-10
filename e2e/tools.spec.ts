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

  test('verifies BIP-137, records history and downloads a proof card', async ({ page }) => {
    await page.goto('/tools#message-signature', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Verify a signed message' })).toBeVisible()
    await page.getByLabel('Signing address', { exact: true }).fill('mpLQjfK79b7CCV4VMJWEWAj5Mpx8Up5zxB')
    await page.locator('#message-text').fill('This is just a test message')
    await page.getByLabel('Base64 signature').fill(
      'INbVnW4e6PeRmsv2Qgu8NuopvrVjkcxob+sX8OcZG0SALhWybUjzMLPdAsXI46YZGb0KQTRii+wWIQzRpG/U+S0=',
    )
    await page.getByRole('button', { name: 'Verify message' }).click()
    await expect(page.getByText('BIP-137 signature verifies')).toBeVisible()
    await expect(page.getByText('Check the message context')).toBeVisible()
    await expect(page.getByText('1 local', { exact: true })).toBeVisible()

    const download = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Share proof card' }).click()
    expect((await download).suggestedFilename()).toMatch(/^motopass-message-signature-.*\.png$/)
    await expect(page.getByRole('button', { name: 'Card downloaded' })).toBeVisible()
  })

  test('detects a pasted artifact and opens its card with the value', async ({ page }) => {
    await page.goto('/tools', { waitUntil: 'domcontentloaded' })
    await page
      .getByLabel('Invoice, BOLT12, PSBT, address, signed message, zap or DM event, LNURL or NIP-05 name')
      .fill(
        'lnbc2500u1pvjluezpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpu9qrsgquk0rl77nj30yxdy8j9vdx85fkpmdla2087ne0xh8nhedh8w27ky0ke0nmw9wqj9d7c8qk786x8f7n0hq2f8h4z8k7wq3n0x8m0t',
      )
    await expect(page.getByText('Detected: BOLT11 invoice')).toBeVisible()
    await page.getByRole('button', { name: 'Open card' }).click()
    await expect(page).toHaveURL(/#bolt11/)
    await expect(page.locator('#bolt11-input')).toHaveValue(/^lnbc2500u/)
  })

  test('verifies a published BIP-322 taproot proof', async ({ page }) => {
    await page.goto('/tools#message-signature', { waitUntil: 'domcontentloaded' })
    await page.getByLabel('Signing address', { exact: true }).fill('bc1pss0zhytly75awhm6x2hhvd5lnzv3vssgrf9axfheq8ldyzn88ges79fler')
    await page.getByLabel('Exact message (empty is allowed for BIP-322)').fill('No prefix fallback')
    await page.getByLabel('Base64 signature').fill(
      'AUCJYOwOjxYAvatTAGYaVlNXBVyFuc4MwNQkOuK2tl8xhfKDONd0NjfYyNSYcRqeCp8hsAnCEPHAVEkO9h6vbQ/R',
    )
    await page.getByRole('button', { name: 'Verify message' }).click()
    await expect(page.getByText('BIP-322 simple signature verifies')).toBeVisible()
    await expect(page.getByText('output key · pass')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Copy receipt link' })).toBeVisible()
  })

  test('opens the shared-receipt verifier and rejects invalid JSON', async ({ page }) => {
    await page.goto('/tools/receipt', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Check a shared receipt' })).toBeVisible()
    await page.getByRole('button', { name: 'Paste a receipt link or JSON instead' }).click()
    await page.getByLabel('Receipt link or JSON').fill('{not json')
    await page.getByRole('button', { name: 'Check receipt' }).click()
    await expect(page.getByText('That is not valid JSON')).toBeVisible()
  })
})
