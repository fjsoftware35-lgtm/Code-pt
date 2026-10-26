/* Ajudante de IA: conversa com o servidor intermédio (Worker), que guarda a chave em segredo */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const hist = [];
  let aOcupar = false;

  const fab = document.createElement('button');
  fab.className = 'ia-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Abrir o ajudante');
  fab.textContent = '🤖';
  const pn = document.createElement('div');
  pn.className = 'ia-painel';
  pn.hidden = true;
  pn.innerHTML = '<div class="ia-topo"><strong>🤖 Ajudante Palavra</strong><button class="ia-fechar" type="button" aria-label="Fechar">✕</button></div><div class="ia-msgs" aria-live="polite"></div><div class="ia-sugestoes"></div><div class="ia-linha"><textarea class="ia-texto" rows="1" placeholder="Pergunta o que quiseres…"></textarea><button class="btn btn-correr ia-enviar" type="button">Enviar</button></div>';
  document.body.append(fab, pn);
  const msgs = pn.querySelector('.ia-msgs'), txt = pn.querySelector('.ia-texto'), env = pn.querySelector('.ia-enviar');

  function bolha(papel, texto) {
    const d = document.createElement('div');
    d.className = 'ia-bolha ia-' + papel;
    texto.split(/```(?:[a-zA-Z]*)\n?/).forEach((parte, i) => {
      if (i % 2 === 1) {
        const pre = document.createElement('pre'); pre.textContent = parte.replace(/\n$/, '');
        const u = document.createElement('button'); u.type = 'button'; u.className = 'ia-usar'; u.textContent = 'Usar no editor';
        u.addEventListener('click', () => { const f = $('#fonte'); f.value = pre.firstChild.textContent; f.dispatchEvent(new Event('input')); pn.hidden = true; });
        d.append(pre, u);
      } else if (parte.trim()) { const p = document.createElement('p'); p.textContent = parte.trim(); d.appendChild(p); }
    });
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  async function enviar(texto) {
    texto = texto.trim();
    if (!texto || aOcupar) return;
    bolha('eu', texto);
    txt.value = '';
    const url = (window.PALAVRA_CONFIG || {}).ajudaUrl;
    if (!url) { bolha('ia', 'A ajuda ainda não está ligada. Quem criou a app tem de colocar o endereço do servidor no ficheiro config.js.'); return; }
    aOcupar = true; env.disabled = true;
    hist.push({ role: 'user', content: texto });
    const espera = bolha('ia', 'A pensar…');
    const erros = document.querySelectorAll('.l-erro');
    const ctl = new AbortController();
    const rel = setTimeout(() => ctl.abort(), 30000);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctl.signal,
        body: JSON.stringify({ mensagens: hist.slice(-6), codigo: $('#fonte').value.slice(0, 4000), erro: erros.length ? erros[erros.length - 1].textContent.slice(0, 400) : '' }) });
      const j = await r.json();
      if (!r.ok || !j.resposta) throw new Error(j.erro || 'sem resposta');
      hist.push({ role: 'assistant', content: j.resposta });
      espera.remove(); bolha('ia', j.resposta);
    } catch (e) {
      hist.pop(); espera.remove();
      bolha('ia', 'Não consegui responder agora. Confirma a internet e tenta de novo daqui a pouco.');
    } finally { clearTimeout(rel); aOcupar = false; env.disabled = false; }
  }

  [['Explica o meu código', 'Explica o meu código passo a passo.'], ['Porque dá erro?', 'Porque é que o meu programa dá erro?'], ['Dá-me uma ideia', 'Dá-me uma ideia de exercício para praticar.']].forEach(([rot, msg]) => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'ia-chip'; b.textContent = rot;
    b.addEventListener('click', () => enviar(msg));
    pn.querySelector('.ia-sugestoes').appendChild(b);
  });
  fab.addEventListener('click', () => {
    pn.hidden = !pn.hidden;
    if (!pn.hidden && !msgs.children.length) bolha('ia', 'Olá! Sou o teu ajudante. Posso explicar o teu código, ajudar com erros ou dar ideias. O que queres saber?');
  });
  pn.querySelector('.ia-fechar').addEventListener('click', () => { pn.hidden = true; });
  env.addEventListener('click', () => enviar(txt.value));
  txt.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(txt.value); } });
})();
