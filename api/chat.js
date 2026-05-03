/* =========================================================================
   /api/chat — Vercel Edge function
   -------------------------------------------------------------------------
   Streams Claude responses to the Eflitte chat widget via Server-Sent Events.

   Setup:
   1. Place this file at  api/chat.js  in your Vercel project root.
   2. In Vercel dashboard, set environment variable:
        ANTHROPIC_API_KEY = sk-ant-...
   3. Deploy. The widget will POST to /api/chat automatically.

   Local dev:
        npm i -g vercel
        vercel dev
   ========================================================================= */

export const config = { runtime: 'edge' };

const ANTHROPIC_API   = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VER   = '2023-06-01';

// Haiku 4.5 — fast and cheap, plenty smart for lead qualification.
// For higher-quality replies switch to 'claude-sonnet-4-6'.
const MODEL = 'claude-haiku-4-5-20251001';

const MAX_TURNS    = 30;     // hard cap on history sent to model
const MAX_INPUT_CH = 8000;   // per-message char cap (defense)

/* ---------------- system prompt -----------------
   ⚠️ CUSTOMIZE the [bracketed] sections with your real services & pricing.
   Both Slovenian and English instructions live in the same prompt — Claude
   will reply in whatever language the user writes in.
------------------------------------------------- */
const SYSTEM_PROMPT = `Si AI asistent agencije **Eflitte** — slovenske AI agencije, ki podjetjem gradi prilagojene AI agente, RAG sisteme, chatbote in avtomatizacije poslovnih procesov.

# About Eflitte (use this to answer questions)
- **Kaj delamo / What we do**: [zamenjajte s tremi do petimi vrsticami — npr. "Custom AI agents, document Q&A (RAG), workflow automation, internal copilots, chatbot integrations."]
- **Tehnologije / Stack**: Claude (Anthropic), OpenAI, LangChain, vector DBs (Pinecone, Postgres+pgvector), Python/Node, n8n, Make, Zapier
- **Tipične cene / Typical pricing**:
  - AI agent / chatbot: 2.000 € – 8.000 € (odvisno od kompleksnosti)
  - RAG sistem: 3.000 € – 12.000 €
  - Avtomatizacije: 1.500 € naprej
  - Mesečno vzdrževanje: 200 € – 800 €
- **Tipičen rok / Timeline**: 2–6 tednov za prototip, 6–12 tednov za produkcijo
- **Lokacija / Location**: Slovenija, delamo z naročniki po vsej EU
- **Kontakt**: info@eflitte.si

# Tvoja vloga / Your role
1. **Prijazno pozdraviš** in razumeš, kaj uporabnik išče.
2. **Kvalificiraš lead-a** — z naravnim pogovorom (ne anketo!) izveš:
   - Velikost podjetja in panogo
   - Kateri proces / problem želi rešiti
   - Okvirno proračun in časovnico
   - Ali že uporablja kakšne AI/avtomatizacijske rešitve
3. **Predlagaš naslednji korak** — če je lead obetaven, povabi na **15-min uvodni klic** in povej, da naj pošlje povpraševanje na info@eflitte.si ali izpolni kontaktni obrazec.
4. **Ne izmišljaj si** — če nečesa ne veš (točna cena za specifičen primer, časovnica), to **odkrito povej** in usmeri na klic z ekipo.

# Pravila / Rules
- **Jezik**: odgovarjaj v jeziku, v katerem ti uporabnik piše (slovensko ali angleško). V slovenščini uporabljaj **vikanje**.
- **Slog**: prijazno, profesionalno, jedrnato. Ne preveč prodajno. Brez emojijev (razen v pozdravu).
- **Dolžina**: 2–4 stavki na sporočilo razen če uporabnik izrecno prosi za več. Ne piši dolgih monologov.
- **Markdown**: lahko uporabljaš **krepko**, *poševno*, kratke sezname (-) in [linke](https://...).
- **Občutljivi podatki**: nikoli ne sprašuj po kreditnih karticah, geslih ali OIB-u/davčni številki. Nikoli ne obljubljaj točnih cen brez pregleda specifikacije.
- **Izven obsega**: če uporabnik sprašuje stvari, ki niso povezane z Eflitte (splošna AI vprašanja, programiranje, šolske naloge ...), prijazno preusmeri pogovor nazaj na to, kako lahko Eflitte pomaga njegovemu podjetju.

# What you should NEVER do
- Pretend to be a human. If asked, you are an AI assistant for Eflitte.
- Make up case studies, client names, or specific results.
- Quote firm prices for complex projects — always say "potrebujemo kratek uvodni klic za natančno ponudbo".
- Send emails, schedule meetings, or claim to do anything beyond chatting.

Začni s kratkim, prijaznim odgovorom na uporabnikovo prvo sporočilo.`;

/* ---------------- handler ---------------- */
export default async function handler(req) {
  // CORS / method
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders()
    });
  }
  if (req.method !== 'POST') {
    return jsonError(405, 'Method not allowed');
  }

  // API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[chat] ANTHROPIC_API_KEY not set');
    return jsonError(500, 'Server not configured');
  }

  // parse body
  let body;
  try { body = await req.json(); }
  catch { return jsonError(400, 'Invalid JSON'); }

  const messages = Array.isArray(body.messages) ? body.messages : null;
  if (!messages || messages.length === 0) {
    return jsonError(400, 'messages[] required');
  }

  // sanitize + cap
  const cleaned = messages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_INPUT_CH) }))
    .slice(-MAX_TURNS);

  if (cleaned.length === 0 || cleaned[cleaned.length - 1].role !== 'user') {
    return jsonError(400, 'last message must be from user');
  }

  // call Anthropic
  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'x-api-key':          apiKey,
        'anthropic-version':  ANTHROPIC_VER
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        stream:     true,
        messages:   cleaned
      })
    });
  } catch (err) {
    console.error('[chat] upstream fetch failed', err);
    return jsonError(502, 'Upstream unavailable');
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    console.error('[chat] upstream error', upstream.status, errText);
    return jsonError(502, 'Upstream error');
  }

  // transform Anthropic SSE → simple {type:'text', text:'...'} SSE for the widget
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buf = '';

      const send = (obj) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          const events = buf.split('\n\n');
          buf = events.pop() || '';
          for (const evt of events) {
            const dataLine = evt.split('\n').find(l => l.startsWith('data:'));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload) continue;
            try {
              const data = JSON.parse(payload);
              if (data.type === 'content_block_delta' && data.delta?.type === 'text_delta') {
                send({ type: 'text', text: data.delta.text });
              } else if (data.type === 'message_stop') {
                send({ type: 'done' });
              } else if (data.type === 'error') {
                send({ type: 'error', message: data.error?.message || 'unknown' });
              }
            } catch { /* ignore parse errors on partial events */ }
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } catch (err) {
        console.error('[chat] stream error', err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'stream interrupted' })}\n\n`));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type':       'text/event-stream; charset=utf-8',
      'Cache-Control':      'no-cache, no-transform',
      'Connection':         'keep-alive',
      ...corsHeaders()
    }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',  // tighten to your domain in prod, e.g. 'https://eflitte.si'
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() }
  });
}
