import { test, expect, type Page, type Route } from '@playwright/test'

/** Lazy routes need domcontentloaded + content wait (not full load). */
const gotoOpts = { waitUntil: 'domcontentloaded' as const }

/**
 * Deterministic stand-ins for the watchdog feed written by
 * scripts/write-intel.mjs. Serve these so the page assertions don't depend on
 * live probe state that legitimately moves between runs.
 *
 * Mirrors the real shape the harness writes — a `kind:'rule'` event carries NO
 * `status` field (coverage events do). That omission is deliberate here too.
 */
const MONITOR = {
  generated_at: new Date().toISOString(),
  total_urls: 3,
  by_country: [
    {
      program_id: 7,
      name: 'Paraguay',
      changed: true,
      urls: [{ url: 'https://migraciones.gov.py/residencia-temporal/', status: 'ok', last_probed: new Date().toISOString() }],
    },
    {
      program_id: 8,
      name: 'United Arab Emirates',
      changed: false,
      urls: [
        { url: 'https://www.vara.ae/', status: 'blocked', last_probed: new Date().toISOString() },
        { url: 'https://icp.gov.ae/en/', status: 'ok', last_probed: new Date().toISOString() },
      ],
    },
    {
      program_id: 9,
      name: 'Atlantis',
      changed: false,
      urls: [{ url: 'https://www.atlantis.gov.example/', status: 'unreachable', last_probed: null }],
    },
    {
      program_id: 10,
      name: 'Gibraltar',
      changed: false,
      urls: [{ url: 'https://www.gibraltar.gov.gi/', status: 'blocked', last_probed: new Date().toISOString() }],
    },
  ],
}

const EVENTS = [
  {
    id: '2026-09-30T10:00:00.000Z-py-rule',
    ts: '2026-09-30T10:00:00.000Z',
    date: '2026-09-30',
    country: 'Paraguay',
    program_id: 7,
    url: 'https://migraciones.gov.py/residencia-temporal/',
    kind: 'rule',
    scopes: ['Rules'],
    before: 'old rule text',
    after: 'new rule text',
  },
  {
    id: '2026-09-30T10:00:00.000Z-ae-cov',
    ts: '2026-09-30T10:00:00.000Z',
    date: '2026-09-30',
    country: 'United Arab Emirates',
    program_id: 8,
    url: 'https://icp.gov.ae/en/',
    kind: 'coverage',
    status: 'unreachable',
  },
]

async function serveFeeds(page: Page) {
  await page.route('**/data/source-monitor.json', (route: Route) => route.fulfill({ json: MONITOR }))
  await page.route('**/data/source-events.json', (route: Route) => route.fulfill({ json: EVENTS }))
}

test.describe('/sources — Source Monitor', () => {
  test('renders country cards, counts and a rule event from the live feeds', async ({ page }) => {
    await serveFeeds(page)
    await page.goto('/sources', gotoOpts)

    const monitor = page.getByRole('heading', { name: /know the moment a country/i })
    await expect(monitor).toBeVisible({ timeout: 20_000 })

    // All three countries render, hostnames stripped of www, program id shown.
    // .first() because a country name also occurs inside its host div
    // (case-insensitive substring: "Atlantis" ~ "atlantis.gov.example").
    const grid = page.locator('#smLayout > div').first()
    for (const name of ['Paraguay', 'United Arab Emirates', 'Atlantis']) {
      await expect(grid.getByText(name).first()).toBeVisible()
    }
    await expect(grid.getByText('migraciones.gov.py')).toBeVisible()
    await expect(grid.getByText('CHANGED')).toBeVisible()

    // UAE's best-status is ok (one of its urls is ok) despite the walled url.
    await expect(grid.getByText('healthy').first()).toBeVisible()
    await expect(grid.getByText('blocked').first()).toBeVisible()

    // Feed rail: the rule event shows the diff, the coverage event shows status.
    const rail = page.getByText('Recent activity').locator('..')
    await expect(rail.getByText('Paraguay')).toBeVisible()
    await expect(rail.getByText(/rule change in/)).toBeVisible()
    await expect(rail.getByText(/\+new rule text/)).toBeVisible()
    await expect(rail.getByText('United Arab Emirates')).toBeVisible()
  })

  test('status filter chips narrow the country grid', async ({ page }) => {
    await serveFeeds(page)
    await page.goto('/sources', gotoOpts)
    await expect(page.getByRole('heading', { name: /know the moment a country/i })).toBeVisible({ timeout: 20_000 })

    const grid = page.locator('#smLayout > div').first()
    // Gibraltar is the only all-blocked country; UAE's best-status is ok.
    await page.getByRole('button', { name: 'blocked', exact: true }).click()
    await expect(grid.getByText('Gibraltar').first()).toBeVisible()
    await expect(grid.getByText('Paraguay')).toHaveCount(0)
    await expect(grid.getByText('Atlantis')).toHaveCount(0)
    await expect(grid.getByText('United Arab Emirates')).toHaveCount(0)

    await page.getByRole('button', { name: 'unreachable', exact: true }).click()
    await expect(grid.getByText('Atlantis').first()).toBeVisible()
    await expect(grid.getByText('United Arab Emirates')).toHaveCount(0)

    await page.getByRole('button', { name: 'All', exact: true }).click()
    await expect(grid.getByText('Paraguay')).toBeVisible()
  })

  test('page never crashes into the error boundary', async ({ page }) => {
    await serveFeeds(page)
    const fatal: string[] = []
    page.on('pageerror', (e) => {
      if (/useLocation|useI18n must|Something went wrong/i.test(e.message)) fatal.push(e.message)
    })
    await page.goto('/sources', gotoOpts)
    await expect(page.locator('main')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('heading', { name: /something went wrong/i })).toHaveCount(0)
    expect(fatal).toEqual([])
  })
})

test.describe('/thank-you', () => {
  for (const path of ['/thank-you', '/apply/thank-you']) {
    test(`renders confirmation state on ${path}`, async ({ page }) => {
      await page.goto(path, gotoOpts)

      await expect(page.getByText('Application submitted', { exact: true })).toBeVisible({ timeout: 20_000 })
      // The next-steps heading renders CSS-uppercased, so it's asserted via its
      // unique child step text instead of a case-sensitive text match.
      await expect(page.getByText(/one real Lightning payment/i)).toBeVisible()
      await expect(page.getByText(/no tracking pixels/i)).toBeVisible()

      // Canonical URL is derived from the env-configured site origin, not a
      // hard-coded literal (regression guard for the SeoHead path fix). Both
      // routes intentionally share the /thank-you canonical — the component
      // pins path="/thank-you".
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        'href',
        'https://motopass.giveabit.io/thank-you',
      )
      await expect(page).toHaveURL(new RegExp(`${path.replace('/', '\\/')}$`))
    })
  }

  test('next-step links navigate to vault and agents', async ({ page }) => {
    await page.goto('/thank-you', gotoOpts)
    const vault = page.getByRole('link', { name: /open your vault/i })
    await expect(vault).toBeVisible({ timeout: 20_000 })
    await vault.click()
    await expect(page).toHaveURL(/\/vault/)

    await page.goBack()
    await page.getByRole('link', { name: /meet the agents/i }).click()
    await expect(page).toHaveURL(/\/agents/)
  })

  test('page never crashes into the error boundary', async ({ page }) => {
    const fatal: string[] = []
    page.on('pageerror', (e) => {
      if (/useLocation|useI18n must|Something went wrong/i.test(e.message)) fatal.push(e.message)
    })
    await page.goto('/thank-you', gotoOpts)
    await expect(page.getByText('Application submitted', { exact: true })).toBeVisible({ timeout: 20_000 })
    expect(fatal).toEqual([])
  })
})
