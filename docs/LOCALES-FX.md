# Locales + Display-Currency + FX (BUILD step 4)

Live language **and** display-currency selectors wired to real locales and a real,
honest FX path. Shipped 2026-08-22.

## What's live
- **Language** — existing 10-locale selector (nav + mobile drawer). English is the
  fully-translated locale; French covers nav/pitch/footer/currency UI; other locales
  fall back to English per `t()`. Switching language translates surfaced chrome.
- **Display currency** — NEW selector (nav + mobile drawer), fully client-side
  (localStorage key `motopass-currency`), BTC-first: default **sats**, switchable to
  whole BTC or any fiat (USD/EUR/GBP/CHF/JPY/INR/CAD/AUD). Per-language suggestion
  (French→EUR) is a one-tap hint, NEVER auto-applied, always overridable.
- **Re-pricing** — `BtcDualPrice` (used by program cards, detail modal, table,
  simulator total, compare) now renders in the active currency. Spot ticker follows it.

## The honest FX path — 5-step chain, 'absent' never faked
`src/lib/fx.ts`:
1. **CoinGecko** no-key `simple/price` BTC→fiat — primary live.
2. **CoinGecko BTC→USD × ECB daily** `eurofxref-daily.xml` fiat-fiat — authoritative cross.
3. **Stored snapshot** `public/research/fx-snapshot.json` — last known good, marked stale.
4. **Pitch-anchor** `BTC_USD_REFERENCE` × snapshot cross — honest fallback, marked stale.
5. **Absent** — `ratePerBtc: null`, UI shows 'FX unavailable' + BTC-anchored sats,
   never a fabricated number.

Stale/missing rates are labelled in the UI (stale badge, amber). Live smoke test on
2026-08-22: EUR €66,201 / GBP £56,682 / JPY ¥12,291,097 / CHF CHF 61,964 per BTC.

## BTC-first data anchor
`src/data/btcPriceAtCapture.ts` — `BTC_USD_AT_CAPTURE = 77,264` (CoinGecko,
2026-08-22). Every stored USD figure is reconstructable to sats:
`sats = usd / BTC_USD_AT_CAPTURE × 100_000_000`, so thresholds stay reconstructable
even when the live FX feed is absent.

## Sync
`public/research/fx-snapshot.json` is the offline fallback; refresh it (and the
anchor) whenever the dataset is re-captured. Pipeline hook: `scripts/sync-fx-snapshot.mjs`
(see step-1 pipeline card).
