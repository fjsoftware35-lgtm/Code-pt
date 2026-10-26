/* Tema Vidro: ícones no menu lateral e botão de recolher/expandir */
(function () {
  'use strict';
  const ICONES = {
    licoes: '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/>',
    desafios: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    paginas: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>',
    referencia: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    ingles: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  };
  const painel = document.querySelector('#aprender');
  const abas = document.querySelector('.abas');
  if (!painel || !abas) return;
  abas.querySelectorAll('.aba').forEach((b) => {
    const t = b.textContent.trim();
    b.title = t;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONES[b.dataset.aba] || ICONES.licoes) + '</svg><span class="aba-t"></span>';
    b.querySelector('.aba-t').textContent = t;
  });
  const tg = document.createElement('button');
  tg.type = 'button';
  tg.className = 'rail-toggle';
  const pintar = () => {
    const aberto = painel.classList.contains('expandido');
    tg.textContent = aberto ? '‹' : '›';
    tg.setAttribute('aria-label', aberto ? 'Recolher menu' : 'Expandir menu');
  };
  tg.addEventListener('click', () => { painel.classList.toggle('expandido'); pintar(); });
  abas.insertBefore(tg, abas.firstChild);
  pintar();
})();

/* Interruptor claro/escuro, no fundo do menu lateral */
(function () {
  'use strict';
  const abas = document.querySelector('.abas');
  if (!abas) return;
  const CH = 'palavra.tema';
  const ler = () => { try { return localStorage.getItem(CH); } catch (e) { return null; } };
  const gravar = (v) => { try { localStorage.setItem(CH, v); } catch (e) { /* sem armazenamento */ } };
  const SOL = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>';
  const LUA = '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>';
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'rail-item';
  abas.appendChild(b);
  function aplicar(t) {
    document.documentElement.dataset.tema = t;
    const claro = t === 'claro';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (claro ? LUA : SOL) + '</svg><span class="aba-t">' + (claro ? 'Escuro' : 'Claro') + '</span>';
    b.title = claro ? 'Mudar para tema escuro' : 'Mudar para tema claro';
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = claro ? '#efeaff' : '#0b0724';
  }
  b.addEventListener('click', () => { const n = document.documentElement.dataset.tema === 'claro' ? 'escuro' : 'claro'; gravar(n); aplicar(n); });
  aplicar(ler() === 'claro' ? 'claro' : 'escuro');
})();
