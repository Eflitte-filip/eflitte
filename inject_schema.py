#!/usr/bin/env python3
"""
Injects JSON-LD schema into Eflitte site HTML files.
Approach: append new schema <script> blocks before </head>.
Idempotent: skips a file's chunk if its marker is already present.
"""
import re, pathlib, json, sys, datetime

ROOT = pathlib.Path("/home/claude/work/eflitte-geo")
TODAY = datetime.date.today().isoformat()

# ---------- Schema builders ----------

ORG_ID = "https://eflitte.si/#organization"
SITE_ID = "https://eflitte.si/#website"

WEBSITE = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": SITE_ID,
    "url": "https://eflitte.si/",
    "name": "Eflitte",
    "description": "Slovenska AI agencija: AI-pripravljene spletne strani, chatboti, avtomatizacija notranjih procesov.",
    "inLanguage": ["sl-SI", "en-US"],
    "publisher": {"@id": ORG_ID}
}

# ---------- index.html FAQs (4) ----------
INDEX_FAQS = [
    ("Kaj točno je razlika med AI agencijo in klasično web/IT agencijo?",
     "Klasična web agencija dela strani z generičnimi orodji (WordPress, template-i) in običajno ne razume AI plasti. Klasična IT agencija dela tehnično dobro, ampak redko razmišlja o pozicioniranju in copy-ju. Pri nas je AI plast del vsake odločitve — od kako stran rangira v ChatGPT-ju do kako interna logika obravnava vašo e-pošto. To ni dodatek, je integralni del rešitve."),
    ("Kako varujete naše podatke?",
     "Občutljivi podatki ostanejo v EU podatkovnih centrih ali v vašem lastnem okolju. Ne gredo v javno zalogo in ne služijo za učenje modelov. Pred začetkom projekta podpišemo dogovor o obdelavi podatkov (DPA). Pri reguliranih panogah (zdravstvo, finance) gradimo EU-only setup z dodatnimi varovali."),
    ("Zakaj bi uvajali AI, če že imamo ChatGPT?",
     "ChatGPT je odličen osebni pomočnik. Za podjetje pa pomeni, da vsak zaposleni ročno kopira podatke v aplikacijo zunaj vaše infrastrukture. Sistemska implementacija pomeni, da AI deluje neposredno v vaših procesih — z dovoljenji, beležkami in nadzorom — brez ročnega posredovanja in brez tveganja, da gredo občutljivi podatki ven."),
    ("Ali bomo po uvedbi odvisni od vas?",
     "Koda je vaša, dostavimo jo z dokumentacijo. Infrastruktura je v vašem imenu. Če se nekoč odločite delati z drugim partnerjem ali vzeti razvoj v lastno ekipo, vam to omogočamo. Ne gradimo lock-ina; gradimo odnos, v katerem ostanete, ker vam to koristi.")
]

# ---------- web.html FAQs (5) ----------
WEB_FAQS = [
    ("Pred 2 letoma smo redizajnali stran. Zakaj bi vlagali ponovno?",
     "Pred 2 letoma je obstajala v glavnem samo Google indeksacija. Danes obstaja paralelna AI indeksacija (ChatGPT, Perplexity, Google AI Overviews) z drugačnimi pravili. Stran iz 2022 ni bila zgrajena s tem v mislih. Vprašanje ni \"ali je stran lepa\", ampak \"ali AI iskalniki vidijo, kdo ste\". Pogosto najprej naredimo nadgradnjo obstoječe strani namesto popolne prenove — če je tehnično mogoče. Pregled pokaže, kateri pristop je smiseln."),
    ("Mi smo specifična panoga. Razumete našo stranko?",
     "Pregled procesov je zasnovan ravno za to. V prvih dneh študiramo vašo panogo, intervjuvamo vas in 1–2 osebi iz ekipe, preučimo konkurenco. Naša prednost ni, da že znamo vašo panogo bolje od vas — ampak da prinesemo strukturirano zunanjo perspektivo in tehnično ekspertizo, ki jo večina v vaši panogi nima. Vi prinesete kontekst, mi metodologijo."),
    ("Kaj če AI chatbot reče kaj narobe?",
     "Chatbot zgradimo s tremi varovali: (1) treniran je na specifičnih vsebinah vašega podjetja, ne splošnem internetu, (2) sistemski prompt mu jasno določa, o čem sme govoriti in kdaj naj reče \"tega ne vem, pišite na info@\", (3) pred public zagonom imamo 14-dnevni \"tihi test\", kjer vi vidite vsak pogovor in lahko popravite ton. Po zagonu beležimo vse pogovore — vsako napako lahko izsledimo in popravimo prompt."),
    ("Kako dolgo traja, koliko stane?",
     "Rok in cena sta odvisna od posameznega projekta. Delamo hitro, časovno in cenovno učinkovito. Specifikacije sprejmemo na info@eflitte.si ali prek uvodnega klica, nato pripravimo pisni predračun."),
    ("Kako varujete naše podatke in podatke obiskovalcev?",
     "Hosting v EU regiji (Frankfurt). Pogovori s chatbotom se ne shranjujejo v naši bazi — pretok podatkov gre prek API klica do Anthropic ali OpenAI (oba EU-skladna prek SCC + EU-US Data Privacy Framework), odgovor se prikaže v brskalniku in zaključi. Pri reguliranih panogah (zdravstvo, finance) gradimo self-hosted setup z lokalnimi LLM modeli, kjer občutljivi podatki nikoli ne zapustijo vašega okolja. Vse pred začetkom projekta zapečatimo s podpisom DPA.")
]

# ---------- avtomatizacija.html FAQs (8) ----------
AVT_FAQS = [
    ("Naši procesi so zelo specifični.",
     "Pregled procesov je zasnovan ravno za to. V prvih dneh intervjuvamo vas in ključne osebe, mapiramo procese in razumemo, kaj je res specifično vašemu poslu in kaj je generično. V praksi je 60–70 % procesov v malih podjetjih podobnih (obravnava povpraševanj, fakturiranje, poročanje) — preostanek je edinstven in zahteva individualen pristop. Pregled pokaže, kateri del je kateri."),
    ("Smo poskusili že z Zapier/Make, pa ni bilo dosti bolje.",
     "To je realistična izkušnja — ad-hoc avtomatizacija deluje do prve kompleksnosti, potem se zlomi in ni nikogar, ki bi to popravil. Razlika med \"Zapier postavi sam direktor\" in \"produkcijsko zanesljiv sistem\" je v error handlingu, monitoringu, dokumentaciji, vzdrževanju in tem, kaj se zgodi, ko se nekaj zlomi sredi noči. Avtomatizacijo zgradimo kot sistem, ne kot hobby projekt."),
    ("Kaj če avtomatizacija naredi nekaj narobe? Kdo je odgovoren?",
     "Pri kritičnih korakih (denar, pogodbe, javna komunikacija) avtomatizacija pripravi osnutek, končna potrditev je vedno na človeku. Za rutinske odločitve (kategorizacija e-pošte, status update, obvestila) sistem dela samostojno, ampak vsak korak se beleži in je sledljiv. Odgovornost ostane pri vašem podjetju, ker so to vaši procesi — naša odgovornost je, da je sistem zgrajen pravilno in da se napake hitro odkrijejo."),
    ("Naša ekipa se boji, da jih boste nadomestili.",
     "Realna skrb — in dejanski razlog, zakaj veliko avtomatizacijskih projektov propade ob notranjem odporu. Naš pristop: avtomatizacija premešča repetitivno delo v delo, ki zahteva samo presojo."),
    ("Kje so naši podatki? Gredo v ZDA?",
     "n8n teče na vašem strežniku ali EU shrambi (Frankfurt) — tam ostane vsa logika in zgodovina. LLM klici (Anthropic, OpenAI) gredo prek EU regij ponudnikov, kjer to omogočajo. Anthropic je certificiran v EU-US Data Privacy Framework in podpisuje SCC; OpenAI prav tako. Občutljivi podatki (zdravstvo, finance) lahko obdelujemo z lokalnimi LLM modeli (Llama, Mistral) na vašem strežniku — v tem primeru podatki nikoli ne zapustijo vašega okolja. Pred začetkom projekta podpišemo DPA."),
    ("Kaj če se avtomatizacija zlomi sredi noči?",
     "Vsak proces ima obravnavo napak in alarme. Ko se nekaj ne posreči (API timeout, neveljavni podatki, preseženje rate limita), sistem to zabeleži in pošlje obvestilo nam — pogosto prej kot stranki sploh kaj zmoti. To je glavni razlog za operativno skrb: aktivni nadzor in hiter odziv, ne le pasivno \"vzdrževanje\"."),
    ("Kako dolgo traja, koliko stane?",
     "Trajanje sprinta je odvisno od kompleksnosti procesa, števila integracij in obsega podatkov stranke. Ne moremo dati zavezujočega okvirja brez razumevanja konteksta — zato Pregled procesov. Glede cene: brez specifikacij ne moremo dati zavezujoče ponudbe. Specifikacije sprejmemo na info@eflitte.si ali prek uvodnega pogovora, nato pripravimo pisni predračun."),
    ("Mora najprej naš IT pregledati?",
     "Pri večjih podjetjih je IT pregled standarden in upravičen — gre za vaše sisteme in podatke. Pripravimo tehnični dokument, ki opisuje arhitekturo, dostope, varnost, skladnost z GDPR in plan disaster recovery. Tipično IT pregled traja 1–2 tedna in je del začetka projekta — ne ovira, ampak korak, ki gradi zaupanje.")
]

def faqpage(faqs, page_url):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": page_url + "#faq",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a}
            } for q, a in faqs
        ]
    }

def breadcrumb(items):
    """items: list of (name, url) tuples"""
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": i+1, "name": name, "item": url}
            for i, (name, url) in enumerate(items)
        ]
    }

def webpage(url, name, description, breadcrumb_id=None, is_part_of_site=True):
    page = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "@id": url + "#webpage",
        "url": url,
        "name": name,
        "description": description,
        "inLanguage": "sl-SI",
        "dateModified": TODAY,
        "publisher": {"@id": ORG_ID}
    }
    if is_part_of_site:
        page["isPartOf"] = {"@id": SITE_ID}
    if breadcrumb_id:
        page["breadcrumb"] = {"@id": breadcrumb_id}
    return page

# ---------- Service schemas (enhanced) ----------

WEB_SERVICE = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://eflitte.si/web#service",
    "name": "AI-pripravljena spletna stran",
    "alternateName": "AI-ready website",
    "url": "https://eflitte.si/web",
    "provider": {"@id": ORG_ID},
    "areaServed": [
        {"@type": "Country", "name": "Slovenia"},
        {"@type": "AdministrativeArea", "name": "European Union"}
    ],
    "description": "Sodobna spletna stran, optimizirana za Google in AI iskalnike (ChatGPT, Claude, Perplexity, Google AI Overviews), z integriranim AI chatbotom in strukturiranimi podatki za citiranje.",
    "serviceType": ["Web design", "SEO", "Generative Engine Optimization", "AI Search Optimization", "Chatbot integration", "LLMO"],
    "category": "AI Web Development",
    "audience": {"@type": "BusinessAudience", "audienceType": "Small and medium businesses in Slovenia and EU"},
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Eflitte spletna prisotnost",
        "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Custom HTML spletna stran"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "SEO + GEO/LLMO optimizacija"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "AI chatbot integracija (Claude/GPT)"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Strukturirani podatki (Schema.org)"}}
        ]
    }
}

AVT_SERVICE = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": "https://eflitte.si/avtomatizacija#service",
    "name": "Avtomatizacija procesov",
    "alternateName": "Workflow automation",
    "url": "https://eflitte.si/avtomatizacija",
    "provider": {"@id": ORG_ID},
    "areaServed": [
        {"@type": "Country", "name": "Slovenia"},
        {"@type": "AdministrativeArea", "name": "European Union"}
    ],
    "description": "Workflow avtomatizacija z n8n in LLM logiko: obravnava povpraševanj, opomniki za fakture, razvrščanje e-pošte, poročanje, AI upravljanje dokumentov. Self-hosted infrastruktura v EU regiji, skladno z GDPR.",
    "serviceType": ["Workflow automation", "AI integration", "Process automation", "Business process automation", "RAG systems", "Document AI"],
    "category": "Business Process Automation",
    "audience": {"@type": "BusinessAudience", "audienceType": "Small and medium businesses in Slovenia and EU"},
    "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Eflitte avtomatizacija",
        "itemListElement": [
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Avtomatizacija notranjih procesov (n8n)"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "AI upravljanje podatkov in dokumentov (RAG)"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Optimizacija marketinga in raziskav"}},
            {"@type": "Offer", "itemOffered": {"@type": "Service", "name": "Self-hosted LLM (Llama, Mistral)"}}
        ]
    }
}

# ---------- Injection logic ----------

MARKER = "<!-- GEO schema injected by Eflitte build -->"
REMOVE_OLD_SERVICE_RE = re.compile(
    r'\n?<script type="application/ld\+json">\s*\{\s*"@context":"https://schema\.org","@type":"Service"[^<]*?\}\s*</script>\n?',
    re.DOTALL
)
REMOVE_OLD_SERVICE_RE_PRETTY = re.compile(
    r'\n?<script type="application/ld\+json">\s*\{\s*"@context":\s*"https://schema\.org",\s*"@type":\s*"Service".*?</script>\n?',
    re.DOTALL
)

def inject(filepath: pathlib.Path, schemas: list, remove_existing_service=False):
    html = filepath.read_text(encoding="utf-8")
    if MARKER in html:
        print(f"  SKIP (already injected): {filepath.name}")
        return
    if remove_existing_service:
        before = len(html)
        html = REMOVE_OLD_SERVICE_RE.sub("\n", html)
        html = REMOVE_OLD_SERVICE_RE_PRETTY.sub("\n", html)
        if len(html) < before:
            print(f"  Removed old minimal Service schema in {filepath.name}")

    blocks = [MARKER]
    for s in schemas:
        blocks.append('<script type="application/ld+json">')
        blocks.append(json.dumps(s, ensure_ascii=False, indent=2))
        blocks.append('</script>')
    inject_str = "\n" + "\n".join(blocks) + "\n"

    if "</head>" not in html:
        print(f"  ERROR: no </head> in {filepath.name}")
        return
    html = html.replace("</head>", inject_str + "</head>", 1)
    filepath.write_text(html, encoding="utf-8")
    print(f"  OK: {filepath.name}  (+{len(schemas)} schema block(s))")

# ---------- Run ----------
def main():
    print("Injecting schema into eflitte-geo/ ...")

    # index.html — add WebSite + FAQPage (Organization + ProfessionalService already present)
    inject(ROOT/"index.html", [
        WEBSITE,
        faqpage(INDEX_FAQS, "https://eflitte.si/"),
        webpage("https://eflitte.si/", "Eflitte — AI rešitve & avtomatizacija",
                "Slovenska AI agencija: AI-pripravljene spletne strani, chatboti, avtomatizacija notranjih procesov.",
                is_part_of_site=False)  # homepage is the site
    ])

    # web.html — replace minimal Service + add FAQPage + BreadcrumbList + WebPage
    web_breadcrumb = breadcrumb([
        ("Domov", "https://eflitte.si/"),
        ("Spletna stran", "https://eflitte.si/web")
    ])
    web_breadcrumb["@id"] = "https://eflitte.si/web#breadcrumb"
    inject(ROOT/"web.html", [
        WEB_SERVICE,
        faqpage(WEB_FAQS, "https://eflitte.si/web"),
        web_breadcrumb,
        webpage("https://eflitte.si/web", "AI-pripravljena spletna stran — Eflitte",
                "Spletna prisotnost, optimizirana za Google in AI iskalnike (ChatGPT, Claude, Perplexity), z integriranim AI asistentom.",
                breadcrumb_id="https://eflitte.si/web#breadcrumb")
    ], remove_existing_service=True)

    # avtomatizacija.html — same pattern
    avt_breadcrumb = breadcrumb([
        ("Domov", "https://eflitte.si/"),
        ("Avtomatizacija", "https://eflitte.si/avtomatizacija")
    ])
    avt_breadcrumb["@id"] = "https://eflitte.si/avtomatizacija#breadcrumb"
    inject(ROOT/"avtomatizacija.html", [
        AVT_SERVICE,
        faqpage(AVT_FAQS, "https://eflitte.si/avtomatizacija"),
        avt_breadcrumb,
        webpage("https://eflitte.si/avtomatizacija", "Avtomatizacija procesov — Eflitte",
                "Workflow avtomatizacija z n8n in LLM logiko. Self-hosted, EU regija, skladno z GDPR.",
                breadcrumb_id="https://eflitte.si/avtomatizacija#breadcrumb")
    ], remove_existing_service=True)

    # impressum.html
    imp_breadcrumb = breadcrumb([
        ("Domov", "https://eflitte.si/"),
        ("Impressum", "https://eflitte.si/impressum.html")
    ])
    imp_breadcrumb["@id"] = "https://eflitte.si/impressum.html#breadcrumb"
    inject(ROOT/"impressum.html", [
        imp_breadcrumb,
        webpage("https://eflitte.si/impressum.html", "Impressum — Eflitte",
                "Pravne informacije podjetja Eflitte (BSMART d.o.o.).",
                breadcrumb_id="https://eflitte.si/impressum.html#breadcrumb")
    ])

    # privacy.html
    priv_breadcrumb = breadcrumb([
        ("Domov", "https://eflitte.si/"),
        ("Politika zasebnosti", "https://eflitte.si/privacy.html")
    ])
    priv_breadcrumb["@id"] = "https://eflitte.si/privacy.html#breadcrumb"
    inject(ROOT/"privacy.html", [
        priv_breadcrumb,
        webpage("https://eflitte.si/privacy.html", "Politika zasebnosti — Eflitte",
                "Politika zasebnosti Eflitte: kako obdelujemo podatke, skladnost z GDPR, EU regija.",
                breadcrumb_id="https://eflitte.si/privacy.html#breadcrumb")
    ])

    # cookies.html
    cok_breadcrumb = breadcrumb([
        ("Domov", "https://eflitte.si/"),
        ("Piškotki", "https://eflitte.si/cookies.html")
    ])
    cok_breadcrumb["@id"] = "https://eflitte.si/cookies.html#breadcrumb"
    inject(ROOT/"cookies.html", [
        cok_breadcrumb,
        webpage("https://eflitte.si/cookies.html", "Politika piškotkov — Eflitte",
                "Pojasnilo o uporabi piškotkov na spletni strani eflitte.si.",
                breadcrumb_id="https://eflitte.si/cookies.html#breadcrumb")
    ])

    # hvala.html (noindex thank-you page, but schema doesn't hurt)
    inject(ROOT/"hvala.html", [
        webpage("https://eflitte.si/hvala", "Hvala — Eflitte",
                "Hvala za vaše sporočilo. Odgovorili vam bomo v najkrajšem možnem času.")
    ])

    print("\nDone.")

if __name__ == "__main__":
    main()
