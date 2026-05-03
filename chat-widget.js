/* =========================================================================
   Eflitte chat widget
   -------------------------------------------------------------------------
   Drop-in script. Add this single line before </body> in your HTML pages:
     <script src="chat-widget.js" defer></script>

   Configuration (optional) — set window.EFLITTE_CHAT_CONFIG before the
   script loads to override defaults:
     window.EFLITTE_CHAT_CONFIG = {
       endpoint: '/api/chat',     // backend endpoint (SSE stream)
       lang:     'auto',          // 'auto' | 'sl' | 'en'
       mock:     false            // true = canned demo response (no backend)
     };
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------- config ---------------- */
  const cfg = Object.assign(
    { endpoint: '/api/chat', lang: 'auto', mock: false },
    window.EFLITTE_CHAT_CONFIG || {}
  );

  /* ---------------- i18n ---------------- */
  const STR = {
    sl: {
      open:        'Odpri pogovor z asistentom',
      close:       'Zapri pogovor',
      title:       'Eflitte asistent',
      online:      'Na voljo',
      greeting:    'Pozdravljeni 👋 Sem AI asistent agencije Eflitte. Kako vam lahko pomagam?',
      placeholder: 'Napišite sporočilo...',
      send:        'Pošlji',
      newChat:     'Nov pogovor',
      error:       'Prišlo je do napake. Poskusite znova ali nas kontaktirajte na info@eflitte.si.',
      disclaimer:  'Pogovori se ne hranijo. Pošlji = Enter, nova vrstica = Shift+Enter.'
    },
    en: {
      open:        'Open chat with assistant',
      close:       'Close chat',
      title:       'Eflitte assistant',
      online:      'Online',
      greeting:    'Hi 👋 I’m Eflitte’s AI assistant. How can I help?',
      placeholder: 'Type a message...',
      send:        'Send',
      newChat:     'New chat',
      error:       'Something went wrong. Please try again or email us at info@eflitte.si.',
      disclaimer:  'Conversations are not stored. Enter = send, Shift+Enter = new line.'
    }
  };

  function detectLang() {
    if (cfg.lang === 'sl' || cfg.lang === 'en') return cfg.lang;
    try {
      const stored = localStorage.getItem('eflitte-lang');
      if (stored === 'sl' || stored === 'en') return stored;
    } catch (_) {}
    const nav = (navigator.language || 'sl').slice(0, 2).toLowerCase();
    return nav === 'sl' ? 'sl' : 'en';
  }
  let lang = detectLang();
  const t = (k) => (STR[lang] && STR[lang][k]) || STR.en[k];

  /* ---------------- styles ---------------- */
  const css = `
  .efc-fab {
    position: fixed; bottom: 24px; right: 24px; z-index: 9998;
    width: 60px; height: 60px; border-radius: 50%;
    background: #CC785C; color: #FAF9F5;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(20,20,19,0.18), 0 2px 6px rgba(20,20,19,0.10);
    transition: transform .2s ease, box-shadow .2s ease, background .2s ease;
    font-family: "Inter", system-ui, sans-serif;
  }
  .efc-fab:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(20,20,19,0.22), 0 3px 8px rgba(20,20,19,0.12); }
  .efc-fab:active { transform: translateY(0); }
  .efc-fab svg { width: 26px; height: 26px; }
  .efc-fab[data-open="true"] { background: #141413; }

  .efc-panel {
    position: fixed; bottom: 96px; right: 24px; z-index: 9999;
    width: 400px; height: min(640px, calc(100vh - 120px));
    background: rgba(250,249,245,0.96);
    backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(20,20,19,0.10);
    border-radius: 16px; overflow: hidden;
    display: flex; flex-direction: column;
    box-shadow: 0 24px 60px rgba(20,20,19,0.20), 0 4px 12px rgba(20,20,19,0.08);
    font-family: "Inter", system-ui, sans-serif;
    color: #141413;
    transform: translateY(12px) scale(.98); opacity: 0; pointer-events: none;
    transition: transform .22s cubic-bezier(.2,.8,.2,1), opacity .22s ease;
  }
  .efc-panel[data-open="true"] { transform: translateY(0) scale(1); opacity: 1; pointer-events: auto; }

  .efc-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 20px; border-bottom: 1px solid rgba(20,20,19,0.08);
    background: rgba(244,242,234,0.6);
  }
  .efc-header-left { display: flex; align-items: center; gap: 12px; }
  .efc-logo {
    font-weight: 700; font-size: 17px; letter-spacing: -0.02em; color: #141413;
    display: inline-flex; align-items: baseline;
  }
  .efc-logo-dot {
    display: inline-block; width: 7px; height: 7px;
    background: #CC785C; border-radius: 50%; margin-left: 1px;
  }
  .efc-status { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #6B6B68; }
  .efc-status-dot {
    width: 7px; height: 7px; border-radius: 50%; background: #4ade80;
    box-shadow: 0 0 0 0 rgba(74,222,128,.5);
    animation: efc-pulse 2.4s ease-in-out infinite;
  }
  @keyframes efc-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,.5); } 50% { box-shadow: 0 0 0 5px rgba(74,222,128,0); } }
  .efc-header-actions { display: flex; gap: 4px; }
  .efc-iconbtn {
    background: transparent; border: none; cursor: pointer;
    width: 32px; height: 32px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #6B6B68; transition: background .15s ease, color .15s ease;
  }
  .efc-iconbtn:hover { background: rgba(20,20,19,0.06); color: #141413; }
  .efc-iconbtn svg { width: 16px; height: 16px; }

  .efc-messages {
    flex: 1; overflow-y: auto; padding: 20px;
    display: flex; flex-direction: column; gap: 14px;
    scroll-behavior: smooth;
  }
  .efc-messages::-webkit-scrollbar { width: 6px; }
  .efc-messages::-webkit-scrollbar-thumb { background: rgba(20,20,19,0.15); border-radius: 3px; }
  .efc-messages::-webkit-scrollbar-track { background: transparent; }

  .efc-msg {
    max-width: 86%; font-size: 14.5px; line-height: 1.55;
    animation: efc-fadein .25s ease;
    word-wrap: break-word; overflow-wrap: break-word;
  }
  @keyframes efc-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
  .efc-msg-user {
    align-self: flex-end;
    background: #141413; color: #FAF9F5;
    padding: 10px 14px; border-radius: 14px 14px 4px 14px;
  }
  .efc-msg-bot {
    align-self: flex-start;
    color: #3D3D3A;
    padding: 2px 4px;
  }
  .efc-msg-bot p { margin: 0 0 8px; }
  .efc-msg-bot p:last-child { margin-bottom: 0; }
  .efc-msg-bot a { color: #CC785C; text-decoration: underline; text-underline-offset: 2px; }
  .efc-msg-bot strong { color: #141413; font-weight: 600; }
  .efc-msg-bot ul, .efc-msg-bot ol { margin: 6px 0 8px 18px; }
  .efc-msg-bot code {
    background: rgba(20,20,19,0.06); padding: 1px 6px; border-radius: 4px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
  }

  .efc-typing {
    display: inline-flex; gap: 4px; padding: 8px 4px;
  }
  .efc-typing span {
    width: 6px; height: 6px; border-radius: 50%;
    background: #6B6B68; opacity: .4;
    animation: efc-bounce 1.2s ease-in-out infinite;
  }
  .efc-typing span:nth-child(2) { animation-delay: .15s; }
  .efc-typing span:nth-child(3) { animation-delay: .3s; }
  @keyframes efc-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: .4; }
    30% { transform: translateY(-3px); opacity: 1; }
  }

  .efc-input-wrap {
    border-top: 1px solid rgba(20,20,19,0.08);
    padding: 12px 14px 14px;
    background: rgba(250,249,245,0.6);
  }
  .efc-input-row {
    display: flex; align-items: flex-end; gap: 8px;
    background: #fff; border: 1px solid rgba(20,20,19,0.10);
    border-radius: 12px; padding: 8px 8px 8px 14px;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .efc-input-row:focus-within { border-color: rgba(204,120,92,0.5); box-shadow: 0 0 0 3px rgba(204,120,92,0.10); }
  .efc-input {
    flex: 1; border: none; outline: none; resize: none;
    font: inherit; font-size: 14.5px; line-height: 1.5;
    color: #141413; background: transparent;
    max-height: 120px; min-height: 22px;
    font-family: "Inter", system-ui, sans-serif;
  }
  .efc-input::placeholder { color: #9A9A96; }
  .efc-send {
    flex: none; width: 32px; height: 32px; border: none; border-radius: 8px;
    background: #CC785C; color: #FAF9F5; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .15s ease, transform .1s ease;
  }
  .efc-send:hover:not(:disabled) { background: #B5664D; }
  .efc-send:active:not(:disabled) { transform: scale(.95); }
  .efc-send:disabled { background: rgba(20,20,19,0.15); cursor: not-allowed; }
  .efc-send svg { width: 14px; height: 14px; }
  .efc-disclaimer {
    margin-top: 8px; padding: 0 4px;
    font-size: 11px; color: #9A9A96; text-align: center; line-height: 1.4;
  }

  @media (max-width: 640px) {
    .efc-fab { bottom: 16px; right: 16px; width: 54px; height: 54px; }
    .efc-fab svg { width: 22px; height: 22px; }
    .efc-panel {
      bottom: 0; right: 0; left: 0; top: 0;
      width: 100%; height: 100%;
      border-radius: 0; border: none;
    }
    .efc-panel[data-open="true"] { transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    .efc-fab, .efc-panel, .efc-msg, .efc-status-dot, .efc-typing span {
      animation: none !important; transition: none !important;
    }
  }
  `;

  /* ---------------- DOM build ---------------- */
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const fab = document.createElement('button');
  fab.className = 'efc-fab';
  fab.setAttribute('aria-label', t('open'));
  fab.dataset.open = 'false';
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>`;

  const panel = document.createElement('div');
  panel.className = 'efc-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', t('title'));
  panel.dataset.open = 'false';
  panel.innerHTML = `
    <div class="efc-header">
      <div class="efc-header-left">
        <span class="efc-logo">Eflitte<span class="efc-logo-dot"></span></span>
        <span class="efc-status"><span class="efc-status-dot"></span>${t('online')}</span>
      </div>
      <div class="efc-header-actions">
        <button class="efc-iconbtn" data-action="reset" aria-label="${t('newChat')}" title="${t('newChat')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
          </svg>
        </button>
        <button class="efc-iconbtn" data-action="close" aria-label="${t('close')}" title="${t('close')}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="efc-messages" id="efc-messages" aria-live="polite"></div>
    <div class="efc-input-wrap">
      <div class="efc-input-row">
        <textarea class="efc-input" rows="1" placeholder="${t('placeholder')}" aria-label="${t('placeholder')}"></textarea>
        <button class="efc-send" aria-label="${t('send')}" disabled>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>
      <div class="efc-disclaimer">${t('disclaimer')}</div>
    </div>
  `;

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const $messages = panel.querySelector('.efc-messages');
  const $input    = panel.querySelector('.efc-input');
  const $send     = panel.querySelector('.efc-send');
  const $reset    = panel.querySelector('[data-action="reset"]');
  const $closeBtn = panel.querySelector('[data-action="close"]');

  /* ---------------- state ---------------- */
  let history = [];           // [{role, content}]
  let busy = false;

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem('eflitte-chat');
      if (raw) history = JSON.parse(raw);
    } catch (_) { history = []; }
  }
  function saveHistory() {
    try { sessionStorage.setItem('eflitte-chat', JSON.stringify(history)); } catch (_) {}
  }
  function clearHistory() {
    history = []; saveHistory(); $messages.innerHTML = '';
    addBotMessage(t('greeting'));
  }

  /* ---------------- rendering ---------------- */
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  // Tiny markdown: **bold**, *italic*, `code`, [text](url), paragraph breaks, lists
  function renderMarkdown(s) {
    let html = escapeHtml(s);
    // links
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    // bold + italic + code
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // simple lists: lines starting with "- " or "* "
    const lines = html.split('\n');
    const out = []; let inList = false;
    for (const line of lines) {
      const m = line.match(/^[-*]\s+(.*)$/);
      if (m) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + m[1] + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        out.push(line);
      }
    }
    if (inList) out.push('</ul>');
    html = out.join('\n');
    // paragraphs from double newlines
    html = html.split(/\n{2,}/).map(p =>
      p.match(/^<(ul|ol|h\d)/) ? p : '<p>' + p.replace(/\n/g, '<br>') + '</p>'
    ).join('');
    return html;
  }

  function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'efc-msg efc-msg-user';
    div.textContent = text;
    $messages.appendChild(div);
    scrollToBottom();
  }
  function addBotMessage(text) {
    const div = document.createElement('div');
    div.className = 'efc-msg efc-msg-bot';
    div.innerHTML = renderMarkdown(text);
    $messages.appendChild(div);
    scrollToBottom();
    return div;
  }
  function addTyping() {
    const div = document.createElement('div');
    div.className = 'efc-msg efc-msg-bot';
    div.innerHTML = '<div class="efc-typing"><span></span><span></span><span></span></div>';
    $messages.appendChild(div);
    scrollToBottom();
    return div;
  }
  function scrollToBottom() {
    requestAnimationFrame(() => { $messages.scrollTop = $messages.scrollHeight; });
  }

  /* ---------------- networking ---------------- */
  async function sendToBackend(messages, onChunk) {
    if (cfg.mock) return mockResponse(messages, onChunk);

    const res = await fetch(cfg.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, lang })
    });
    if (!res.ok || !res.body) throw new Error('Network error: ' + res.status);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const evt of events) {
        const line = evt.split('\n').find(l => l.startsWith('data:'));
        if (!line) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const data = JSON.parse(payload);
          if (data.type === 'text') onChunk(data.text);
          else if (data.type === 'error') throw new Error(data.message || 'API error');
        } catch (e) {
          // ignore malformed events
        }
      }
    }
  }

  // demo-only: streams a canned reply with realistic pacing
  async function mockResponse(messages, onChunk) {
    const last = messages[messages.length - 1].content.toLowerCase();
    let reply;
    if (lang === 'sl') {
      reply = last.includes('cena') || last.includes('kolik')
        ? 'Cene se razlikujejo glede na obseg projekta. Tipičen AI agent stane med **2.000 € in 8.000 €**, integracija z obstoječimi sistemi pa od **1.500 € naprej**.\n\nLahko mi opišete, kaj vas zanima, in pripravim oceno?'
        : 'Hvala za sporočilo! Eflitte gradi prilagojene AI agente, RAG sisteme in avtomatizacije za podjetja. Lahko mi poveste kaj več o tem, kaj iščete?\n\n- Velikost vašega podjetja?\n- Katero področje bi želeli avtomatizirati?\n- Imate roke ali okvirno proračun?';
    } else {
      reply = last.includes('price') || last.includes('cost')
        ? 'Pricing depends on project scope. A typical AI agent ranges from **€2,000–8,000**, and integrations start around **€1,500**.\n\nWant to share what you have in mind so I can give a closer estimate?'
        : 'Thanks for reaching out! Eflitte builds custom AI agents, RAG systems, and automations for businesses. Could you tell me a bit about what you’re looking for?\n\n- Your company size?\n- What process you’d like to automate?\n- Any timeline or rough budget?';
    }
    const tokens = reply.split(/(\s+)/);
    for (const tok of tokens) {
      await new Promise(r => setTimeout(r, 18 + Math.random() * 25));
      onChunk(tok);
    }
  }

  /* ---------------- send flow ---------------- */
  async function handleSend() {
    const text = $input.value.trim();
    if (!text || busy) return;
    busy = true; $send.disabled = true;
    $input.value = ''; autosize();

    addUserMessage(text);
    history.push({ role: 'user', content: text });
    saveHistory();

    const typingNode = addTyping();
    let botNode = null;
    let acc = '';

    try {
      await sendToBackend(history, (chunk) => {
        if (!botNode) {
          typingNode.remove();
          botNode = addBotMessage('');
        }
        acc += chunk;
        botNode.innerHTML = renderMarkdown(acc);
        scrollToBottom();
      });
      if (acc) {
        history.push({ role: 'assistant', content: acc });
        saveHistory();
      } else {
        typingNode.remove();
        addBotMessage(t('error'));
      }
    } catch (err) {
      console.error('[Eflitte chat]', err);
      if (typingNode.parentNode) typingNode.remove();
      addBotMessage(t('error'));
    } finally {
      busy = false; updateSendState();
      $input.focus();
    }
  }

  /* ---------------- input handling ---------------- */
  function autosize() {
    $input.style.height = 'auto';
    $input.style.height = Math.min($input.scrollHeight, 120) + 'px';
  }
  function updateSendState() {
    $send.disabled = busy || $input.value.trim().length === 0;
  }
  $input.addEventListener('input', () => { autosize(); updateSendState(); });
  $input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
  $send.addEventListener('click', handleSend);

  /* ---------------- panel open/close ---------------- */
  function openPanel() {
    panel.dataset.open = 'true';
    fab.dataset.open = 'true';
    fab.setAttribute('aria-label', t('close'));
    setTimeout(() => $input.focus(), 220);
  }
  function closePanel() {
    panel.dataset.open = 'false';
    fab.dataset.open = 'false';
    fab.setAttribute('aria-label', t('open'));
  }
  fab.addEventListener('click', () => {
    if (panel.dataset.open === 'true') closePanel(); else openPanel();
  });
  $closeBtn.addEventListener('click', closePanel);
  $reset.addEventListener('click', clearHistory);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.dataset.open === 'true') closePanel();
  });

  // re-render greeting if site language changes (Eflitte's site stores it in localStorage)
  window.addEventListener('storage', (e) => {
    if (e.key === 'eflitte-lang') {
      lang = detectLang();
      // simplest: clear and re-greet
      clearHistory();
    }
  });

  /* ---------------- init ---------------- */
  loadHistory();
  if (history.length === 0) {
    addBotMessage(t('greeting'));
  } else {
    for (const m of history) {
      if (m.role === 'user') addUserMessage(m.content);
      else addBotMessage(m.content);
    }
  }
})();
