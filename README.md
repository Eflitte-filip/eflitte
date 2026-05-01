# Eflitte — spletna stran

Statična predstavitvena spletna stran za AI agencijo Eflitte. Brez ogrodij, brez build koraka — štiri samostojne HTML datoteke.

## Vsebina

```
eflitte/
├── index.html       — glavna stran
├── privacy.html     — Politika zasebnosti (osnutek, GDPR)
├── cookies.html     — Politika piškotkov
└── impressum.html   — Impressum (zakonsko obvezni podatki)
```

Vse datoteke so samostojne in vključujejo svoj CSS ter JavaScript. Edine zunanje odvisnosti so:
- Inter font (Google Fonts CDN)
- Three.js r128 (Cloudflare CDN) — uporabljen samo za 3D vizualizacijo na hero sekciji
- Simple Icons + LobeHub Icons (CDN-ji za logotipe vendorjev v sekciji Tehnologija)

---

## Pred objavo

### 1. Vstavi podatke v pravne strani

V datotekah `privacy.html` in `impressum.html` so vsa mesta, kjer manjkajo podatki podjetja, označena s **terracotta-rdečim ozadjem** v oglatih oklepajih, npr. `[Polno ime, npr. EFLITTE d.o.o.]`. Te zamenjaj z dejanskimi podatki podjetja iz **AJPES** poslovnega registra.

Obvezni podatki:
- Polno ime podjetja in skrajšana oblika
- Sedež (ulica, hišna številka, pošta, kraj)
- Matična številka
- Davčna številka in ID za DDV (če si zavezanec)
- Sodišče vpisa in vložna številka
- Osnovni kapital
- Zastopnik
- Bančni račun (IBAN + banka)
- E-pošta in opcijska telefonska številka

### 2. Pravni pregled (priporočeno)

Osnutki pravnih dokumentov pokrivajo splošne primere malega slovenskega B2B podjetja, niso pa pravno preverjeni. Pred javno objavo priporočamo:

- **Iubenda** (~30–60 €/leto) — generator privacy policy-ja, prilagojen tvojim storitvam
- **Slovenski odvetnik za digitalno pravo** (~100–200 € enkraten posvet) za pregled vseh treh dokumentov

### 3. Kontakt

E-poštni naslov `info@eflitte.si` je placeholder. Če uporabljaš drugačen, ga zamenjaj v:
- `index.html` (footer + kontaktni obrazec)
- `privacy.html` (več mest)
- `cookies.html` (eno mesto)
- `impressum.html` (eno mesto)

### 4. Kontaktni obrazec — backend

Trenutno je kontaktni obrazec **stub** — JavaScript simulira pošiljanje s 600ms zakasnitvijo. Za pravo pošiljanje sporočil priklopi enega od:

- **Formspree** — najpreprostejše, stub-ov ne moreš več prepoznati od pravega
- **Resend** + Vercel/Netlify Function — nadzorovano, brez tretjih oseb
- **Lasten backend** — če imaš svoj strežnik

V `index.html` poišči komentar `// TODO: replace stub with real endpoint` in zamenjaj `setTimeout` blok s pravim API klicem.

---

## Deploy

Spletna stran ne potrebuje nobenega build koraka. Ustreza vsem statičnim hostingom:

### Vercel
```bash
npm i -g vercel
vercel
```
Sledi navodilom; Vercel samodejno prepozna statične HTML datoteke.

### Netlify
Drag & drop celotne mape na [app.netlify.com/drop](https://app.netlify.com/drop).

### GitHub Pages
1. Ustvari nov repozitorij na GitHubu
2. Naloži vse štiri datoteke
3. V Settings → Pages izberi `main` branch + `/root` folder
4. Stran bo dostopna na `https://[username].github.io/[repo]/`

### Klasični web hosting (FTP)
Naloži vse štiri HTML datoteke v koren spletne mape (običajno `public_html/` ali `www/`).

---

## Razvoj / lokalno preizkušanje

Preprosto odpri `index.html` v brskalniku. Za pravilno delovanje povezav (hash navigacija, footer linki):

```bash
# Python 3
python3 -m http.server 8000

# Node.js
npx serve

# VS Code
# Namesti "Live Server" extension → klikni "Go Live"
```

Stran bo dostopna na `http://localhost:8000`.

---

## Tehnične opombe

- **Bilingvalna**: SL/EN, preklopnik v navigaciji + drawer-u. Trenutni jezik se shrani v `localStorage` (ključ `eflitte-lang`).
- **Mobile-first**: hamburger meni se sproži pri širini ≤1080px.
- **Accessibility**: nav linki imajo `:focus` stanja; vsi obrazni elementi imajo `aria-label`.
- **Performance**: CDN-i so cachable, font se nalaga z `display=swap`. Stran bi morala doseči ≥95 Lighthouse score brez nadaljnjih prilagoditev.
- **Brez analitike**: trenutno NE uporablja Google Analytics, Meta Pixel ipd. Če želiš dodati, posodobi `cookies.html` in dodaj cookie banner.

---

## Licenca / lastništvo

Koda spletnega mesta je intelektualna lastnina podjetja Eflitte. Logotipi vendorjev v sekciji Tehnologija so trgovske znamke njihovih lastnikov, uporabljeni v skladu z licencami CDN ponudnikov (Simple Icons — CC0, LobeHub — MIT).
