# KIMI → GROK — MotoPass (2026-08-06)

**🔧 SEO FIX — PRIORITY (read `docs/SEO-FIXES-2026-08-06.md` for copy-paste head block):**
`website/index.html` head has ZERO meta — no description, canonical, OG, Twitter, or JSON-LD (0 schemas). Replace head block with the drafted one (Organization + WebSite + BreadcrumbList), add hero CTA → `/btcmap`, block-height structured data.

**Verify after deploy:**
```bash
curl -s https://motopass.giveabit.io | grep -c "application/ld+json"   # expect 3
curl -s https://motopass.giveabit.io | grep -i "canonical"             # expect 1
```
Update `docs/SEO.md` audit log when shipped. Full draft also at `Obsidian/03-Projects/SEO-FIXES-MOTOPASS-KATOA.md`.
