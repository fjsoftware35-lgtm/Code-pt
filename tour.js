/* Tutorial de arranque: mostra cada parte da app, passo a passo, na primeira visita */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const CH = 'palavra.tour.v1';
  const PASSOS = [
    { t: 'Bem-vindo ao Palavra! 👋', x: 'Aqui aprendes a programar em português, mesmo sem saber inglês. Vamos fazer uma visita rápida, de 1 minuto.' },
    { p: 'aprender', s: '.abas', t: 'O teu menu', x: 'Aqui escolhes o que fazer: Lições (a base), Desafios (praticar e ganhar ⭐), Páginas (criar sites), Referência e Inglês.' },
    { p: 'aprender', s: '#licoes', t: 'Começa pelas lições', x: 'Toca numa lição e ela aparece no editor, pronta a correr. Começa por "Olá, mundo".' },
    { p: 'codigo', s: '.painel-codigo', t: 'O editor', x: 'Aqui escreves o teu programa. Podes mudar o que quiseres, não estragas nada.' },
    { p: 'codigo', s: '#btnCorrer', t: 'Executar ▶', x: 'Toca aqui para correr o programa. No computador também podes usar Ctrl + Enter.' },
    { p: 'consola', s: '.painel-consola', t: 'A consola', x: 'O resultado do programa aparece aqui. Se o programa fizer uma pergunta, respondes aqui em baixo.' },
    { s: '.ia-fab', t: 'O teu ajudante 🤖', x: 'Ficaste preso? Pergunta ao ajudante. Ele vê o teu código e explica em português simples.' },
    { s: '.btn-py', t: '🐍 Python', x: 'Mostra o teu programa escrito em Python, para ires conhecendo o inglês dos programadores.' },
    { t: 'Tudo pronto! 🎉', x: 'Vamos abrir a primeira lição. Podes ver esta visita outra vez no botão ❓ do menu.', fim: 'Começar a primeira lição' },
  ];
  let i = 0, fundo, luz, cartao;

  function montar() {
    fundo = document.createElement('div'); fundo.className = 'tour-fundo';
    luz = document.createElement('div'); luz.className = 'tour-luz';
    cartao = document.createElement('div'); cartao.className = 'tour-cartao';
    cartao.setAttribute('role', 'dialog');
    fundo.append(luz, cartao);
    document.body.appendChild(fundo);
  }
  function posicionar() {
    const p = PASSOS[i], el = p.s && $(p.s), r = el && el.getBoundingClientRect();
    const centro = !el || r.width < 4 || r.height < 4;
    fundo.classList.toggle('cheio', centro);
    luz.style.display = centro ? 'none' : 'block';
    cartao.className = 'tour-cartao ' + (centro ? 'centro' : r.top > innerHeight / 2 ? 'em-cima' : 'em-baixo');
    if (!centro) {
      const m = 6;
      Object.assign(luz.style, { left: r.left - m + 'px', top: r.top - m + 'px', width: r.width + 2 * m + 'px', height: r.height + 2 * m + 'px' });
    }
  }
  function mostrar(n) {
    i = n;
    const p = PASSOS[i];
    if (p.p) { const b = $('.separadores button[data-painel="' + p.p + '"]'); if (b) b.click(); }
    cartao.innerHTML = '<div class="tour-contador"></div><strong></strong><p></p><div class="tour-botoes"><button class="tour-saltar" type="button">Saltar</button><button class="btn btn-correr tour-seguinte" type="button"></button></div>';
    cartao.querySelector('.tour-contador').textContent = (i + 1) + ' / ' + PASSOS.length;
    cartao.querySelector('strong').textContent = p.t;
    cartao.querySelector('p').textContent = p.x;
    cartao.querySelector('.tour-seguinte').textContent = p.fim || 'Seguinte';
    cartao.querySelector('.tour-seguinte').addEventListener('click', () => (i < PASSOS.length - 1 ? mostrar(i + 1) : acabar(true)));
    cartao.querySelector('.tour-saltar').addEventListener('click', () => acabar(false));
    setTimeout(posicionar, 150);
  }
  function acabar(abrirLicao) {
    try { localStorage.setItem(CH, '1'); } catch (e) { /* sem armazenamento */ }
    fundo.remove(); fundo = null;
    if (abrirLicao) {
      const b = $('.separadores button[data-painel="aprender"]'); if (b) b.click();
      const l = document.querySelector('#licoes .licao'); if (l) l.click();
    }
  }
  function iniciar() { if (fundo) return; montar(); mostrar(0); }
  window.addEventListener('resize', () => { if (fundo) posicionar(); });

  const abas = $('.abas');
  if (abas) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rail-item rail-tutorial'; b.title = 'Ver o tutorial outra vez';
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/></svg><span class="aba-t">Tutorial</span>';
    b.addEventListener('click', iniciar);
    abas.appendChild(b);
  }
  let visto = false;
  try { visto = localStorage.getItem(CH) === '1'; } catch (e) { /* ignora */ }
  if (!visto) setTimeout(iniciar, 700);
})();
