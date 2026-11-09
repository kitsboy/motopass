# Session summary — 2026-11-09

**Chat Topic:** Finish the open source checks and three program tools, then hand the day off cleanly.

**Key Things We Did:**

- Pinned the phone route total to the top of the screen and let the country list scroll away.
- Made a Satohash rate limit retry that one program, then continue the rest of the run.
- Set the intel fresh window to 30 days so it matches the trust envelope.
- Showed the newest probe time on a source card, and the word healthy only when the country is actually up.
- Labeled `cbiu.gov.dm` and `cnmv.es` as probe-only. The 8 Nov human read did not open them.
- Let the advice board lead with one passport.
- Let the change bell copy one country, an address, or a Nostr key, without sending them.
- Opened a receipt under each day bar.

**What We Finished:**

- Phone total: `84aa8e2`. Desktop stays list beside routes.
- Stamp, freshness, source age, probe-only label: `8a81d05`.
- Passport switch, one-country copy, day receipts: `f7aca94`.
- The earlier phone cluster was `5d5c192`. It covered the route buttons, so the later commit replaced that behavior.
- Docs, Paige knowledge, and the Kimi handoff.

**What We Are Still Aiming to Finish:**

- Find real replacement URLs for the Bahamas and Mexico pages that are still unreachable. Do not invent them.
- Do a new human re-read before treating a green probe of `cbiu.gov.dm` or `cnmv.es` as the research date.
- Keep gazette PDFs cited until someone deliberately adds a living gazette homepage to the watch.
- Leave applications closed, and leave Nostr as copy-only.

**Update / Status:** The curated 21 are unchanged. `last_checked` is still 2026-11-08. Uruguay is not an open review. The 9 Nov probe left it unchanged. Deploy is Cloudflare Pages on push to main. No wrangler deploy.

**Key Decisions / Notes:**

- A 429 must not drop the tail of the stamp run, and it must not stamp twice. The proof is written only after success.
- Fresh for 30 days is a label alignment. It is not a new page read, and `intel.json` was not rewritten by hand.
- Antigua is the day bar whose stored sentence states the residency count. Uruguay and El Salvador link an official https URL and say the sentence is not on file.
- The browser does not post a pasted webhook URL.

**Mission Tie-in:** Someone comparing a Bitcoin-friendly residency can see which passport a warning speaks to, what a watched page actually changed, and which day count is already written down, and they can check the stamp instead of trusting the page.
