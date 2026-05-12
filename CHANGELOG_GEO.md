# GEO — Full code-level pass (changelog)

## Step 4 (this build): everything that can be done code-side

### Homepage definition-lead
- Added `hero-eyebrow` line above the H1: **"Eflitte · Slovenska AI agencija"** — gives LLMs an entity-first signal in the first ~20 tokens.
- Replaced thin hero subtitle ("Spletne strani, chatboti, avtomatizacija") with a full **definition paragraph**: *"Eflitte je slovenska AI agencija. Gradimo AI-pripravljene spletne strani, optimizirane za Google in AI iskalnike (ChatGPT, Claude, Perplexity), ter avtomatiziramo notranje procese z n8n in LLM logiko..."*
- The Ginni Rometty quote (H1) is kept — it stays the dramatic hook, but it's no longer the only thing AI sees in the first 150 tokens.

### Meta + Open Graph + Twitter improvements
On `index.html`, `web.html`, `avtomatizacija.html`:
- Rewrote `<meta name="description">` to be entity-dense (Eflitte + service + EU/GDPR + key AI engine names).
- Per-page `og:title`, `og:description` — previously generic "Eflitte" titles, now service-specific.
- Added `og:image:alt` (was missing — accessibility + AI parsability).
- Full Twitter card set on web/avtomatizacija (previously had none).
- Index Twitter card now has a real description (was just "Eflitte").

### Sitemap freshness
- Bumped all `<lastmod>` values to `2026-05-12`. AI engines weigh freshness heavily; old lastmod = lower citation priority.

### New files at site root
- **`ai.txt`** — emerging standard for declaring AI access/citation preferences. Explicit Allow-list for the major bots (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, OAI-SearchBot, CCBot, Applebot-Extended, etc.) + preferred citation format pointer.
- **`humans.txt`** — credit + tech stack disclosure. Small entity-trust signal.
- **`404.html`** — proper 404 page matching site design, with `noindex, follow`, internal links to keep crawlers in-graph, JSON-LD WebPage schema. Vercel serves `404.html` from root automatically — no config change needed.

### Step 2 + 3 recap (already in previous build, unchanged)



- `llms.txt` — short site summary in the llmstxt.org standard format. Links to main pages.
- `llms-full.txt` — full-content version with service descriptions, technical details, and all FAQs consolidated. This is the citation-bait file — AI engines that fetch it get everything they need without having to parse your HTML.

Both files sit at the site root. After deploy they should be reachable at:
- https://eflitte.si/llms.txt
- https://eflitte.si/llms-full.txt

Make sure your hosting (Vercel) serves `.txt` with `Content-Type: text/plain; charset=utf-8`. Should be the default — verify with `curl -I https://eflitte.si/llms.txt` after deploy.

---



## Step 2: Schema injection (also in this build)

Added JSON-LD schema markup to every HTML page. Build script ran on 2026-05-11.

## Files changed

| File | Schema added | Notes |
|---|---|---|
| `index.html` | `WebSite`, `FAQPage`, `WebPage` | Kept existing `Organization` + `ProfessionalService`. New schema references them via `@id`. |
| `web.html` | `Service` (enhanced), `FAQPage`, `BreadcrumbList`, `WebPage` | **Replaced** the old minimal `Service` block with a fuller one (areaServed, hasOfferCatalog, audience). |
| `avtomatizacija.html` | `Service` (enhanced), `FAQPage`, `BreadcrumbList`, `WebPage` | Same — old minimal `Service` was replaced. |
| `impressum.html` | `BreadcrumbList`, `WebPage` | |
| `privacy.html` | `BreadcrumbList`, `WebPage` | |
| `cookies.html` | `BreadcrumbList`, `WebPage` | |
| `hvala.html` | `WebPage` | No breadcrumb (thank-you page). |

All new blocks are inserted right before `</head>`, marked with the comment `<!-- GEO schema injected by Eflitte build -->`.

## Entity graph (how it's linked)

- `Organization` `@id` = `https://eflitte.si/#organization`
- `WebSite` `@id` = `https://eflitte.si/#website`
- Every `WebPage` references `publisher: {"@id": <organization>}` and `isPartOf: {"@id": <website>}`
- Every `Service` references `provider: {"@id": <organization>}`
- Every page (except homepage and `hvala`) has a `BreadcrumbList` referenced from its `WebPage` via `breadcrumb: {"@id": ...#breadcrumb}`

This gives AI engines a fully connected graph instead of disconnected schema islands — important for entity recognition in ChatGPT, Perplexity, Gemini.

## After deploy — verify

1. **Google Rich Results Test**: https://search.google.com/test/rich-results — paste each live URL. Should detect FAQPage on all 3 main pages.
2. **Schema.org Validator**: https://validator.schema.org/ — same. Confirms no syntax issues.
3. **Search Console**: submit `sitemap.xml` again. Enhancements tab should show FAQ + Breadcrumb in 1–2 weeks.
4. **Ahrefs / Screaming Frog**: confirm crawl picks up the new schema on all 7 pages.

## What's left from Step 2

- The `dateModified` value is hardcoded to today's build date. When you push content updates, re-run the script (or update by hand) so freshness signals stay current.
- Logo URL inside the `Organization` schema points to `https://eflitte.si/logo.png` — confirm that file exists, or change the path to your real logo (the codebase has `assets/logo-light-bg.png` and `eflitte-favicon.svg`).
- Consider adding `sameAs` URLs (LinkedIn company page, GitHub, Crunchbase) into `Organization` once those profiles exist — covered in Step 5.

## Re-running the script

If you regenerate any of these pages from a template, just re-run `inject_schema.py`. It's idempotent — checks for the marker comment and skips already-injected files.
