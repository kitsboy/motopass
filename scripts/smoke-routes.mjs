import { chromium } from 'playwright'

const BASE = process.env.SMOKE_URL || 'http://127.0.0.1:4173'
const routes = ['/', '/programs', '/register', '/dashboard']
const scratch = process.env.SCRATCH || '.'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
const errors = []

page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
})

for (const route of routes) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  const main = await page.locator('main').innerText()
  if (!main?.trim()) throw new Error(`Empty main at ${route}`)
  await page.screenshot({ path: `${scratch}/smoke-${route.replace(/\//g, '_') || 'home'}.png` })
}

const logoImg = page.locator('img[src*="logo"]').first()
if ((await logoImg.count()) === 0) throw new Error('Logo img not found')
const logoSrc = await logoImg.getAttribute('src')
const logoResp = await page.request.get(new URL(logoSrc, BASE).href)
if (!logoResp.ok()) throw new Error(`Logo src did not resolve: ${logoSrc} (${logoResp.status()})`)

if (errors.length) throw new Error(`Console errors: ${errors.join('; ')}`)

await browser.close()
console.log('Smoke OK', routes.length, 'routes')