# Spremembe v tem buildu (vs. tvoj original)

## ✅ Že narejeno v tem ZIP-u — samo deployaj

### Nove datoteke
- `og-image.png` (1200×630, 63 KB) — placeholder OG za social/AI sharing
- `logo.png` (799×449) — za Organization schema (zdaj velja)
- `logo-square.png` (512×512) — backup square verzija

### Patchirani fajli
- `index.html` — dodan **Person schema** (#filip), `Organization.founder` → `@id` reference
- `web.html` — dodan Person schema, dodan OG meta blok (prej ga ni bilo)
- `avtomatizacija.html` — dodan Person schema, dodan OG meta blok (prej ga ni bilo)
- `vpogledi/*.html` (4 fajli) — dodan Person schema, `Article.author` → Filip (Person) namesto Organization
- `llms-full.txt` — dodan GitHub URL pod identity sekcijo

### Person schema vsebina
GitHub URL: `https://github.com/Eflitte-filip` (samo to imam)

## ⚠️ Manjka — pošlji takoj ko imaš

1. **LinkedIn URL** → najpomembnejši entity signal za "Slovenian AI agency founder"
   Lahko regeneriram in pošlješ patch — ali samo dodaj na vsa mesta:

   ```
   "sameAs": [
     "https://github.com/Eflitte-filip",
     "https://www.linkedin.com/in/TVOJ-HANDLE/"
   ]
   ```
   Pojavi se v 7 fajlih: index, web, avtomatizacija, vpogledi/index in 3 blog posti.

2. **X/Twitter ali Medium ali osebni blog** — če imaš

## 🧹 Počiščeno

- Vsi `* 2.html` / `* 2.png` macOS Finder duplikati so odstranjeni
- `.DS_Store` odstranjen
- `.git/` mapa ne vključena (deploy artifakt, ne rabi)

## 🚀 Vercel deploy

```bash
unzip eflitte-deploy.zip
cd eflitte
vercel --prod
```

Ali drag-n-drop celotno mapo v Vercel dashboard.

`vercel.json` ostaja: `cleanUrls: true, trailingSlash: false` (to dela
`/web` route brez `.html`).

## 🧪 Post-deploy verifikacija

1. **Schema test:**
   https://search.google.com/test/rich-results?url=https%3A%2F%2Feflitte.si
   → naj prepozna: Organization, LocalBusiness, WebPage, WebSite, FAQPage, Person
   → 0 napak za logo (zdaj `logo.png` obstaja)

2. **OG preview:**
   https://www.opengraph.xyz/url/https%3A%2F%2Feflitte.si%2F
   → naj prikaže og-image.png

3. **LLM citation test (ročno):**
   - V ChatGPT: "Slovenian AI agency that builds GEO-optimized websites" → ali se pojavi Eflitte?
   - V Perplexity: "kdo je Filip Noe Kovačič" → ali ima entity card?
   - V Claude.ai: "what is eflitte.si" → ali model najde tvoj llms.txt?

   Realno: prvih 3-6 mesecev po deploy-u **ne pričakuj rezultatov**. LLM-i te
   ne bodo citirali brez backlinkov in mentions. Tehnika ti naredi
   1 % pokritosti, content/PR strategija 99 %.

## 📝 Naslednji koraki, prioritetno

1. Pošlji LinkedIn → regeneriram schema
2. Boljši og-image v Figmi z Inter + Instrument Serif fontoma (ta moj je placeholder)
3. **Pravi `/en/` paths** (ne `?lang=en` JS toggle) — če ciljaš EU
4. 1 vpogled/2 tedna naslednjih 6 mesecev
5. Gostujoči članek na Računalniške novice ali Monitor
