# DEPLOY navodila — drop-in zamenjava

Datum: 2026-05-05

Spodnji seznam je natančen vodnik, kaj se zamenja, kaj doda in kaj ostane.
**Vse poti so relativne na koren tvojega Vercel projekta.**

---

## 🔄 ZAMENJAJ (obstajajo, prepiši)

| Trenutna pot | Razlog |
|---|---|
| `index.html` | Popolnoma nova vsebina — homepage z dvotirno strukturo |
| `api/chat.js` | Posodobljen system prompt za novo strukturo paketov |
| `sitemap.xml` | Dodana `/web` in `/avtomatizacija` URL-ja |
| `robots.txt` | Manjše čiščenje, dodani vsi AI bots |

## ➕ DODAJ (nove datoteke)

| Pot | Kaj |
|---|---|
| `web.html` | Landing za AI-Ready spletno stran |
| `avtomatizacija.html` | Landing za Avtomatizacijo procesov |
| `vercel.json` | **KRITIČNO** — brez tega `/web` in `/avtomatizacija` v navigaciji 404-irata |
| `favicon.svg` | Generativni favicon (krem ozadje + E + terracotta dot) |
| `assets/logo-dark-bg.svg` | Originalni Fiverr logo, krem na črnem (za dark hero, footer) |
| `assets/logo-dark-bg.png` | Isti, PNG fallback |
| `assets/logo-light-bg.svg` | Originalni Fiverr logo, črn na transparentu (za nav, light backgrounds) |
| `assets/logo-light-bg.png` | Isti, PNG fallback |

## ✋ NE DOTIKAJ SE (ostanejo nespremenjeni)

| Pot | Opomba |
|---|---|
| `chat-widget.js` | Frontend widget — brez sprememb |
| `cookies.html` | Pravna stran — brez sprememb |
| `impressum.html` | Pravna stran — brez sprememb |
| `privacy.html` | Pravna stran — brez sprememb |
| `README.md` | Tvoj interni readme |
| `SEO-DEPLOYMENT-GUIDE.md` | Tvoj interni guide |

> Te datoteke so vključene v outputs/ samo zato, da imaš popoln pregled,
> če si potrebuješ. Pri prepisu jih lahko ignoriraš.

---

## ⚠️ TODO pred public launchem

### 1. Kontaktni obrazec na `index.html` je še vedno stub
Iskat v `index.html`:
```js
// TODO: replace stub with real endpoint
setTimeout(() => {
  status.className = 'form-status ok';
  ...
}, 600);
```

**Najhitrejša rešitev (10 min)** — Formspree:
1. Registracija na formspree.io (brezplačno za 50 mesečnih submission-ov)
2. Ustvari nov form, dobiš endpoint kot `https://formspree.io/f/xyzabc12`
3. V `index.html` zamenjaj setTimeout blok z:
```js
const data = new FormData(form);
fetch('https://formspree.io/f/TVOJ_ID', {
  method: 'POST',
  body: data,
  headers: { 'Accept': 'application/json' }
})
.then(r => r.ok ? r.json() : Promise.reject())
.then(() => {
  status.className = 'form-status ok';
  status.textContent = lang === 'en'
    ? 'Thanks — we will get back to you within 24 hours.'
    : 'Hvala — odzvali se bomo v 24 urah.';
  form.reset();
})
.catch(() => {
  status.className = 'form-status err';
  status.textContent = lang === 'en'
    ? 'Sending failed. Please email info@eflitte.si directly.'
    : 'Pošiljanje ni uspelo. Prosimo, pišite na info@eflitte.si.';
});
```

**Boljša rešitev (45 min)** — Resend + Vercel API route. Daj vedeti, če rabiš pomoč.

### 2. og-image.png (1200×630)
Trenutno meta tagi referencirajo `https://eflitte.si/og-image.png`, ki ne obstaja.
**Začasno**: postavi `assets/logo-dark-bg.png` v root kot `og-image.png`.
**Pravilno**: oblikuj 1200×630 z naslovom + tagline + logom v Figmi/Canvi.

### 3. Favicon set (opcijsko)
Trenutno samo `favicon.svg`. Moderni brskalniki to sprejmejo, ampak za starejše brskalnike in Apple Touch:
- `favicon-16x16.png`
- `favicon-32x32.png`
- `apple-touch-icon.png` (180×180)
- `site.webmanifest`

`index.html` že ima reference (kot tudi obstoječa stran je imela). Manjkajoče datoteke 404-irajo, kar ni show-stopper. Dodaj naknadno.

---

## 🚀 Deploy korak za korakom (Vercel)

```bash
# 1. V tvojem lokalnem repo direktoriju
cp /pot/do/outputs/index.html .
cp /pot/do/outputs/web.html .
cp /pot/do/outputs/avtomatizacija.html .
cp /pot/do/outputs/sitemap.xml .
cp /pot/do/outputs/robots.txt .
cp /pot/do/outputs/vercel.json .
cp /pot/do/outputs/favicon.svg .
cp /pot/do/outputs/api/chat.js api/chat.js
mkdir -p assets
cp /pot/do/outputs/assets/* assets/

# 2. Git
git add .
git commit -m "Restructure: dvotirna produktna struktura (Web + Operations)"
git push

# Vercel auto-deploya ob pushu.
```

## 🧪 Smoke test po deployu

Pojdi na vsako od teh URL-jev in preveri:

- [ ] `https://eflitte.si/` — homepage, dark hero, two-paths sekcija deluje
- [ ] `https://eflitte.si/web` — nalaga (ne 404). Če 404-ira, **vercel.json ni bil deployan** ali Vercel cache ni osvežen
- [ ] `https://eflitte.si/avtomatizacija` — nalaga
- [ ] Klik na "Spletna stran" v navigaciji homepage-a vodi na `/web`
- [ ] Klik na "Avtomatizacija" v navigaciji homepage-a vodi na `/avtomatizacija`
- [ ] Klik na "Pogovorimo se" gumb v hero-u vodi na `/#kontakt` (homepage z anchor)
- [ ] Chatbot v desnem spodnjem kotu se odpre, pozdravi v slovenščini, prepoznava ime "Flit"
- [ ] Vprašaj chatbot: "Kakšen paket priporočate za hotel z 20 sobami?" → mora omeniti **Chatbot Sprint**
- [ ] Vprašaj chatbot: "Koliko stane spletna stran?" → mora preusmeriti na `info@eflitte.si`, **brez** specifične cene
- [ ] Lang toggle (EN/SL) v desnem zgornjem kotu — kompletna stran se prevede
- [ ] Mobilna velikost (375×667) — drawer menu deluje
- [ ] Vsak FAQ se odpre/zapre

## 📊 Po deployu (SEO)

1. Google Search Console → resubmit sitemap
2. Bing Webmaster → resubmit sitemap
3. Schema validator: https://search.google.com/test/rich-results — stestiraj vse 3 strani
4. PageSpeed Insights — verjetno >90 score, ker ni tracker-jev/bundlov
5. Mobile Friendly Test
6. Test AI vidnost — odpri ChatGPT in vpiši: "Katere so AI agencije v Sloveniji?" — preveri, ali si v rezultatu (lahko traja 2-4 tedne, da reindeksirajo)

---

## Vprašanja, ki jih bom verjetno dobil nazaj

**"Logo v navigaciji ne uporablja moje SVG datoteke."**
Drži — nav uporablja text-based "Eflitte." z animacijo (E ostane, "flitte" se sklene ob scrollu). Če hočeš svoj SVG namesto tega, mi povej — zamenjam, ampak izgubiš collapse animacijo.

**"Three.js animacije ni več."**
Zavestna odločitev za prvi pass: dark hero ima zdaj CSS gradient mesh + grid pattern + noise texture. Hitrejše za naložiti, manj kompleksno za vzdrževati. Lahko dodam Three.js scene nazaj kot ločen task.

**"Routing /web in /avtomatizacija ne deluje."**
Preveri, da je `vercel.json` deployed na root. Brez `cleanUrls: true` Vercel servira datoteke samo na `/web.html`. Po push-u Vercel rabi 30-60 sekund, da reflektira config spremembe.

**"Tehnologije v footer-ju manjkajo."**
Te so v starem index.html bile v "Tech stack" sekciji. Pri novem index.html je sekcija odstranjena (homepage je čista, focus na konverziji), `/avtomatizacija` pa ima svojo tech stack chips sekcijo s slovenskimi orodji highlightani.

**"Kje je 'AI agenti' / 'Razumevanje dokumentov' / itd. iz starega seznama?"**
Te storitve **še vedno ponujamo**, ampak so se v novi strukturi spojile pod paketih:
- **AI agenti / dokumenti** = del `Automation Sprint` (pri `/avtomatizacija`)
- **Pogovorni vmesniki / chatboti** = lasten paket `Chatbot Sprint` (pri `/web`) ali integriran v `AI-Ready spletna stran`
- **Napovedni modeli** = ad-hoc, naročilo prek `info@eflitte.si`

V chatbot system promptu so vse te storitve omenjene v razdelku 3, da Flit ve, kaj odgovoriti, ko vprašajo specifično.
