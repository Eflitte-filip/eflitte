# SEO popravki — vodnik za deployment

**Datum:** 3. maj 2026
**Korak roadmap-a:** 2 (Tehnična postavitev) — delno

---

## Kaj je v tem paketu

| Datoteka | Status | Akcija |
|---|---|---|
| `index.html` | **Posodobljena** — dodan SEO `<head>`, JSON-LD schema | Zamenjaj obstoječo |
| `cookies.html` | Posodobljena meta sekcija | Zamenjaj obstoječo |
| `privacy.html` | Posodobljena meta sekcija | Zamenjaj obstoječo |
| `impressum.html` | Posodobljena meta sekcija | Zamenjaj obstoječo |
| `sitemap.xml` | **Nova** | Naloži v koren |
| `robots.txt` | **Nova** | Naloži v koren |
| `site.webmanifest` | **Nova** | Naloži v koren |

---

## Kaj sem konkretno spremenil

### 1. `index.html` `<head>` — popolna SEO opremljenost

**Dodano:**

- **Meta description** — manjkalo je popolnoma. Brez tega Google sam izbira, kaj prikaže pod naslovom v iskalniku.
- **`robots`** = `index, follow, max-image-preview:large` — eksplicitno dovoljuje indeksiranje in velike slike v rezultatih.
- **`canonical` URL** — pove Googlu, da je `https://eflitte.si/` glavna različica strani (preprečuje duplikate, npr. če nekdo deli povezavo z `?utm_source=...`).
- **`hreflang` za SL/EN** — jezikovne alternative. Trenutno EN živi na isti URL z `?lang=en`, kar je **začasna rešitev** (idealno bi bila `/en/` ali poddomena, ampak to zahteva prestrukturiranje).
- **Open Graph tagi** — kako se stran prikaže, ko jo nekdo deli na LinkedIn, Facebook, WhatsApp, Slack itd. Brez teh je deljiva povezava videti kot smeti.
- **Twitter/X Card** — enako za X/Twitter.
- **Theme color** — barva URL bara na mobilnem brskalniku.
- **Favicon povezave** — pripravljeno za favicon set (glej spodaj "Kaj moraš še narediti").

### 2. JSON-LD strukturirani podatki

Vstavil sem štiri schema bloke v `<head>`. To je ključno za AI iskalnike (Google AI Overviews, ChatGPT, Perplexity, Claude) in rich results v Googlu:

- **Organization** — kdo si, kontakt, področja znanja
- **ProfessionalService (LocalBusiness)** — **kritično za "AI agencija Maribor"**. Pove Googlu, da si lokalno podjetje s sedežem v Mariboru, deluješ v Sloveniji, primarno Maribor/Ljubljana/Celje.
- **WebSite** — osnovne informacije o strani
- **FAQPage** — vseh 5 FAQ vprašanj. To lahko prikažejo direktno v Googlu (rich snippet) in jih AI asistenti pogosto citirajo.

### 3. `sitemap.xml`

Seznam vseh URL-jev za Googlebot. Trenutno 4 (homepage + 3 pravne strani). Ko boš dodajal nove strani (storitve, panoge, blog), to datoteko posodobi.

### 4. `robots.txt`

- Dovoli vsem crawler-jem
- Eksplicitno dovoli Claude, Perplexity, Google-Extended (za prikaz v AI odgovorih)
- Komentar pripravljen, če bi kasneje želel blokirati AI training crawlerje (GPTBot, CCBot)
- Pokaže pot do sitemapa

### 5. Pravne strani

Dodal canonical URL, OG tagi, robots tag. Obdržal `index, follow` ker pravne strani kažejo legitimnost podjetja in Google to ceni.

---

## ⚠ Kaj moraš ti še narediti (pomembno!)

### A) Pred objavo — manjka, sicer bo nekaj lokov v console-u

**1. OG slika (`og-image.png`)**
- 1200×630px, format PNG ali JPG
- Predlog: tvoj logotip + slogan "AI agencija za slovenska podjetja" na bež ozadju (#FAF9F5)
- Lahko narediš v Figmi, Canva, ali pa mi pošlji svoj logotip in jaz pripravim SVG predlogo
- Naloži kot `/og-image.png` v koren

**2. Favicon set**
Trenutno meta tagi referencirajo `/favicon.svg`, `/favicon-32x32.png`, `/apple-touch-icon.png`, itd. — teh datotek še ni.
- Najlažje: gre na **realfavicongenerator.net**, naložiš svoj logotip, prenese ti zip s celim setom, razpakiraš v koren strani.
- Ali pa za začetek samo en `favicon.svg` z barvasto piko logotipa — povsem dovolj.

**3. Logo (`logo.png`)**
JSON-LD Organization schema referencira `https://eflitte.si/logo.png`. Pripravi ga (transparent PNG, ~512×512px) in naloži v koren.

### B) Po objavi — registracija pri Googlu

**1. Google Search Console** ([search.google.com/search-console](https://search.google.com/search-console))
- Dodaj property za `eflitte.si`
- Verificiraj (najlažje preko DNS TXT record — če uporabljaš GitHub Pages CNAME, dodaš TXT pri tvojem DNS providerju)
- Submit sitemap: `https://eflitte.si/sitemap.xml`
- **Ta korak je obvezen** — brez njega ne vidiš, kdo te najde, za katere ključne besede, in kakšne napake so

**2. Google Business Profile** ([business.google.com](https://business.google.com))
- Ustvari profil za "EFLITTE" v Mariboru
- Kategorija: "Marketing agency" + "Software company" (Google ima bolj specifično "AI agency" v testu, lahko poskusiš)
- Doda fotografije, opis, kontakt, delovni čas
- **Ključno za "AI agencija Maribor" Google Maps rezultate**

**3. Bing Webmaster Tools** ([bing.com/webmasters](https://www.bing.com/webmasters))
- Manj prometa kot Google, a Bing poganja ChatGPT search
- Submit sitemap

### C) Validacija — preveri, da vse dela

Po objavi novih datotek pojdi na:

1. **Schema validator**: [validator.schema.org](https://validator.schema.org/) → vnesi `https://eflitte.si/` → ne sme biti rdečih napak
2. **Rich results test**: [search.google.com/test/rich-results](https://search.google.com/test/rich-results) → enako, posebej preveri FAQ schema
3. **OG validator**: [opengraph.xyz](https://www.opengraph.xyz/) → preveri, kako bo videti deljiva povezava
4. **PageSpeed Insights**: [pagespeed.web.dev](https://pagespeed.web.dev/) → posnetek hitrosti pred in po (verjetno bo +0–2 točki, večinoma enako)

---

## Realna pričakovanja

- **Indeksiranje**: Google bo prvič prišel v 1–7 dneh po submitu sitemapa. Stran bo v rezultatih po približno 2–3 tednih.
- **Prvi rezultati za "AI agencija Maribor"**: 4–8 tednov, *če* imaš Google Business Profile in nekaj backlinkov (kataloge urediva v koraku 6).
- **"AI agencija Slovenija"**: 3–6 mesecev. Bolj konkurenčno, potrebuje vsebino in povezave.
- **AI agencija + panoga (npr. "AI v proizvodnji")**: trenutno ne morem reči, ker še nimaš teh strani. Ko jih bomo zgradili (korak 5), 2–4 mesece za long-tail.

---

## Kaj ne dela in zakaj nisem popravil

**1. Single-page arhitektura še vedno obstaja.**
SEO meta opremljenost ne reši dejstva, da je vse na enem URL-ju. Še vedno je tvoja največja **strateška** SEO omejitev. Naslednji korak roadmap-a — gradnja samostojnih strani za storitve, panoge in lokal — to reši.

**2. EN različica je še vedno na istem URL-ju.**
Idealno bi bilo `/en/` poddirektorij. Trenutni `?lang=en` query parameter z localStorage-om je nestandarden in Google ne zna dobro indeksirati posebej. To je v koraku 3 ali 4.

**3. Še ni Google Analytics / Plausible.**
Ko boš pripravljen meriti, predlagam **Plausible** ali **Umami** namesto Google Analytics — manj GDPR drame, ne potrebujeta cookie banner-ja, lažje merjenje. Lahko ti pomagam postaviti.

**4. Ni še blog/case study strani.**
To je korak 5.

---

## Naslednji korak

Ko dejansko deployaš te datoteke in opraviš A/B/C zgoraj, javi nazaj. Potem gremo na:

**Korak 3: On-page SEO + odgovori na strateška vprašanja**

Še vedno čakam tvoje odgovore na:
1. Katere panoge so tvoj pravi fokus? (Bolje 2–3 odlične kot 6 povprečnih)
2. Imaš case study, tudi anonimno?
3. Koliko časa mesečno za vsebine?

Brez teh odgovorov lahko gradimo tehnično, ne moremo pa zares konkurirati za ključne besede.
