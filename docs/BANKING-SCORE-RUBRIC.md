# Banking score — published rubric

The banking axis used to be empty on 20 of 21 programs because there is no
country-level measure of “how easy is it for a residence or citizenship applicant
to open a local account”. That question depends on the bank, the applicant's
residence and source-of-funds file, not on a statute. Inventing a number would
have made a subjective judgement look like research.

The axis now carries a **published, comparable indicator** with a stated proxy:

## Method

| Step | Rule |
| --- | --- |
| Indicator | World Bank **Global Findex** `FX.OWN.TOTL.ZS` — “Account ownership at a financial institution or with a mobile-money-service provider (% of population ages 15+)” |
| Value | Latest non-null observation per country, as returned by the World Bank API |
| Score | `clamp(round(value / 10), 1, 10)` — a decile, so 98.4% → 10 and 61.2% → 6 |
| Year | Stored per country in `scorecard.banking_basis.year`; observations range 2021–2024 |
| Citation | `scorecard.banking_basis.url` plus an `audit_trail` row with the API URL for that country |
| Refresh | `node scripts/apply-scorecard.mjs` (idempotent; `--dry-run` to inspect) |

The World Bank publishes this series under CC BY 4.0. The API is the source of
record; the score is arithmetic on it.

## What the score means — and what it does not

**It means:** how normal it is for an adult in that country to hold an account at
a bank or mobile-money provider. A high score describes a mature domestic
banking system with broad account penetration.

**It does not mean:** that a non-resident applicant will be accepted. Findex
surveys resident adults. Non-resident onboarding is a bank-by-bank credit and
compliance decision, and no cross-country dataset measures it.

Every record therefore stores `scorecard.banking_note`, which prints the
percentage and the year next to the score, and says “measures domestic access,
not non-resident onboarding”. The UI shows the score and the note together, so
the proxy is never presented as a promise.

## Why this is better than the alternative

The honest alternatives were: leave the axis empty forever, or ask each country
team to score their market “8/10” with no method. A published indicator with a
stated proxy is worse than a real onboarding study and better than an opinion —
and it can be recomputed by anyone from the API URL in the audit row.

## Known holes

- **Cayman Islands** — no Findex observation. The score stays null and
  `scorecard.banking_note` says why.
- **Non-resident onboarding** — not measured. A second axis would be needed
  (`banking_nonresident`) if we later publish a per-bank study with a stated
  applicant profile.
