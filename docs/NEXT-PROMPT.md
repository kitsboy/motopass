> **Note (BUILD-26):** The shipped React app uses **Luminous Sovereign** (light + dark toggle) with 15 routes including `/btcmap` (Leaflet merchant layer). Apply `docs/DESIGN-CONTEXT.md` + `docs/DESIGN-TOKENS.md` for colors. BTC Map pins use `.btcmap-pin` (orange dot, white border). This prompt describes interaction structure; swap dark palette below for current tokens when generating.

A premium, immersive sovereign identity and Bitcoin finance dashboard for MotoPass — the ultimate platform for jurisdictional stacking, citizenship/residency programs, and Bitcoin-native passport acquisition. The interface should feel like a private high-net-worth command center: luxurious, trustworthy, empowering, with strong cyber-sovereign and rebellious Bitcoin energy.

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first (fully responsive down to mobile)
- Theme: Dark, premium cyber-sovereign with Bitcoin orange accents
- Background: Sovereign Black (#0a0a0a) with subtle noise texture or very dark gradient
- Surface: Deep Void Gray (#111111) for cards and panels, with glassmorphic 1px silver borders and whisper-soft diffused shadows
- Primary Accent: Bitcoin Orange (#F7931A) for all primary buttons, active filters, hover states, Bitcoin signals, and sovereignty highlights
- Text Primary: Freedom White (#f4f4f5) for headings and key metrics
- Text Secondary: Sovereign Silver (#a1a1aa) for labels, descriptions, and supporting data
- Positive: Crypto Green (#22c55e) for acquired status, ROI, and success metrics
- Alert: Amber (#f59e0b) for researching/pending items
- Typography: Space Grotesk (600–700) for display headlines, section titles, and sovereignty scores with tight letter-spacing; Inter (300–600) for all body text, finance tables, and filters
- Cards: Generously rounded (16–20px), glassmorphic, subtle elevation that lifts on hover with orange glow
- Buttons: Pill-shaped or subtly rounded, strong orange primary CTAs with black text
- Filters: Rounded-full chips that flip to orange when active
- Modals: Large centered glassmorphic dialogs with passport or funding-flow imagery as background or side panel, rich finance tables, and smooth pop animation
- Imagery: Heavily feature hero.jpg, sovereignty.jpg, passport.jpg, funding-flow.jpg, incubator.jpg, and education.jpg dynamically (hero banners, modal backgrounds, portfolio visuals, section dividers)

**Page Structure:**
1. **Top Navigation:** Logo (MotoPass with orange passport icon), tabs for "My Portfolio", "All Programs", "BTC Map", "Stack Simulator", "Finance Compare", "Research Vault". Right side has Nostr connect, theme toggle, and language selector.
2. **Hero Dashboard Header:** Full-width sovereignty background image with overlay. Large headline "Your Sovereign Stack", key metrics (Acquired Programs, Total Invested, Sovereignty Score, Bitcoin Exposure), quick filters.
3. **My Portfolio Section:** Visual grid of acquired passports (using passport.jpg style cards) with flags, names, Bitcoin integration highlights, tax benefit summaries, and stacking synergy score. Include a "Simulate New Stack" button.
4. **All Programs Explorer:** Powerful filter bar (region, category, investment range slider, crypto-friendly score, status, Lightning Ready toggle). Toggle between beautiful card grid and sortable data table. Each card shows name, category, Bitcoin signal, min investment, key finance highlights, and "Mark Acquired" button.
5. **Finance Deep Dive Modal:** When a program is clicked, open a rich modal with tabs: Overview, Detailed Finance (cost breakdown, gov fees, ROI projections, tax optimization scenarios), Bitcoin Integration (Lightning, legal tender, reserves), Legal & Risk, Sources. Include comparison tools to other programs.
6. **Jurisdictional Stacking Simulator:** Interactive section where user can select multiple programs and see combined tax benefits, total cost, residency timeline, and sovereignty score uplift. Use funding-flow.jpg inspired visuals.
7. **Footer:** Links to research vault, legal Safe Harbour notes, export full dataset, and "Add New Program" form.

Use subtle animations (hover lifts, modal pop, filter transitions). Make every element reinforce themes of sovereignty, Bitcoin freedom, and financial empowerment. Prioritize clarity for high-stakes finance data while maintaining luxurious dark aesthetic.

This prompt is optimized for Stitch or direct HTML/React iteration. It fully incorporates the DESIGN.md created in Step 1 and the detailed requirements from all Grok chats (deep finance, portfolio, advanced filters, stacking tools, immersive passport experience).
