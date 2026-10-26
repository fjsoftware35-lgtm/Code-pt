/* Trilha "Criar páginas": HTML/CSS/JS com pré-visualização e lista de passos */
(function () {
  'use strict';
  const P = window.Palavra;
  const limpo = (c) => c.replace(/<!--[\s\S]*?-->/g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');

  const PAGINAS = [
    { id: 'pg-primeira', titulo: '1. A minha primeira página', resumo: 'Título, texto e lista.',
      ajuda: 'Uma página é feita de etiquetas. <h1> é o título, <p> é um parágrafo e <ul> com <li> faz uma lista.',
      passos: [
        ['Muda o título <h1> para o teu nome', /<h1[^>]*>\s*(?!Olá, mundo!)[^<\s][^<]*<\/h1>/i],
        ['Faz uma lista <ul> com 2 coisas de que gostas (<li>)', /<ul[^>]*>[\s\S]*?<li[^>]*>[\s\S]*?<\/li>[\s\S]*?<li[^>]*>[\s\S]*?<\/li>[\s\S]*?<\/ul>/i],
      ],
      inicio: '<!-- Escreve a tua página aqui -->\n<h1>Olá, mundo!</h1>\n<p>Esta é a minha primeira página.</p>\n\n<!-- 1. Muda o título para o teu nome -->\n<!-- 2. Faz uma lista: <ul><li>futebol</li><li>música</li></ul> -->\n' },
    { id: 'pg-landing', titulo: '2. Landing page da loja', resumo: 'Cabeçalho, botão Comprar e rodapé.',
      ajuda: 'Uma landing page é a página que convence a pessoa a comprar. Tem um cabeçalho forte, um botão grande e um rodapé com contacto.',
      passos: [
        ['Põe o nome da tua loja no <h1>', /<h1[^>]*>\s*(?!Loja do Tomás)[^<\s][^<]*<\/h1>/i],
        ['Cria um botão com texto (<button>)', /<button[^>]*>\s*[^<\s][^<]*<\/button>/i],
        ['Cria um rodapé <footer> com o teu contacto', /<footer[^>]*>[\s\S]*?[A-Za-z0-9À-ÿ][\s\S]*?<\/footer>/i],
      ],
      inicio: '<style>\n  body { font-family: sans-serif; margin: 0; text-align: center; }\n  header { background: #0d7656; color: white; padding: 40px 16px; }\n  button { background: #e0a526; border: 0; padding: 14px 28px; border-radius: 24px; font-size: 18px; }\n  footer { background: #222; color: #ccc; padding: 16px; margin-top: 40px; }\n</style>\n<header>\n  <h1>Loja do Tomás</h1>\n  <p>Netflix, recargas e muito mais!</p>\n  <!-- 1. Muda o nome da loja no título -->\n  <!-- 2. Põe aqui um botão: <button>Comprar</button> -->\n</header>\n<p>Escreve aqui o que vendes.</p>\n<!-- 3. Cria um rodapé: <footer>Fala comigo: 84 000 0000</footer> -->\n' },
    { id: 'pg-login', titulo: '3. Ecrã de login', resumo: 'Campo de senha e mensagem.',
      ajuda: 'Um login pede email e senha. O botão chama uma função em JavaScript que decide: se a senha estiver certa, dá as boas-vindas. Atenção: isto é só o visual. Num login a sério, as senhas ficam guardadas num servidor, nunca no código da página.',
      passos: [
        ['Cria o campo da senha com type="password" e id="senha"', /<input(?=[^>]*type\s*=\s*["']password["'])(?=[^>]*id\s*=\s*["']senha["'])[^>]*>/i],
        ['Usa um if para comparar a senha', /\bif\s*\(/],
        ['Mostra "Bem-vindo!" quando a senha está certa', /Bem-vindo/i],
        ['Mostra "Senha errada" quando está errada', /Senha errada/i],
      ],
      inicio: '<style>\n  body { font-family: sans-serif; background: #eef3f0; display: grid; place-items: center; height: 90vh; }\n  .cartao { background: white; padding: 24px; border-radius: 16px; width: 260px; display: grid; gap: 10px; }\n  input, button { padding: 10px; font-size: 16px; }\n  button { background: #0d7656; color: white; border: 0; border-radius: 8px; }\n</style>\n<div class="cartao">\n  <h2>Entrar</h2>\n  <input id="email" placeholder="O teu email">\n  <!-- 1. Põe aqui o campo da senha: <input id="senha" type="password" placeholder="Senha"> -->\n  <button onclick="entrar()">Entrar</button>\n  <p id="msg"></p>\n</div>\n<script>\nfunction entrar() {\n  var senha = document.getElementById("senha").value;\n  // 2. Se a senha for "1234", mostra "Bem-vindo!". Senão, "Senha errada".\n  document.getElementById("msg").textContent = "";\n}\n</script>\n' },
  ];
  P.PAGINAS = PAGINAS;
  P.limpoPagina = limpo;
  P.totalPaginas = PAGINAS.length;
  if (typeof document === 'undefined') return;

  const $ = (s) => document.querySelector(s);
  const lista = $('#paginas');
  const botoes = [];
  const marcar = () => botoes.forEach(([b, d]) => b.classList.toggle('feito', P.feito(d.id)));

  // ---- ecrã de edição
  const ov = document.createElement('div');
  ov.className = 'pg-fundo';
  ov.hidden = true;
  ov.innerHTML = '<div class="pg-topo"><strong class="pg-titulo"></strong><button class="pg-fechar" aria-label="Fechar">✕</button></div><p class="pg-ajuda"></p><ul class="pg-passos"></ul><div class="pg-sep"><button data-v="cod" class="ativo">Código</button><button data-v="res">Resultado</button></div><div class="pg-area"><textarea class="pg-cod" spellcheck="false" autocapitalize="off"></textarea><iframe class="pg-res" sandbox="allow-scripts" title="Resultado"></iframe></div><button class="btn btn-correr pg-concluir" disabled>Concluir</button>';
  document.body.appendChild(ov);
  const q = (s) => ov.querySelector(s);
  const cod = q('.pg-cod'), res = q('.pg-res'), ul = q('.pg-passos'), conc = q('.pg-concluir');
  let atual = null, tm = null;

  function ver(v) {
    ov.dataset.v = v;
    ov.querySelectorAll('.pg-sep button').forEach((b) => b.classList.toggle('ativo', b.dataset.v === v));
  }
  function atualizar() {
    res.srcdoc = cod.value;
    const c = limpo(cod.value);
    let ok = 0;
    [...ul.children].forEach((li, i) => { const bom = atual.passos[i][1].test(c); if (bom) ok++; li.classList.toggle('bom', bom); li.firstChild.textContent = bom ? '✅ ' : '⬜ '; });
    conc.disabled = ok < atual.passos.length;
  }
  function abrir(d) {
    atual = d;
    q('.pg-titulo').textContent = d.titulo;
    q('.pg-ajuda').textContent = d.ajuda;
    ul.innerHTML = '';
    d.passos.forEach(([t]) => { const li = document.createElement('li'); li.innerHTML = '<span></span><span></span>'; li.lastChild.textContent = t; ul.appendChild(li); });
    cod.value = d.inicio;
    conc.textContent = P.feito(d.id) ? 'Concluído ⭐ (fechar)' : 'Concluir';
    ver('cod');
    ov.hidden = false;
    atualizar();
  }
  cod.addEventListener('input', () => { clearTimeout(tm); tm = setTimeout(atualizar, 300); });
  ov.querySelectorAll('.pg-sep button').forEach((b) => b.addEventListener('click', () => { ver(b.dataset.v); if (b.dataset.v === 'res') atualizar(); }));
  const fechar = () => { ov.hidden = true; marcar(); };
  q('.pg-fechar').addEventListener('click', fechar);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !ov.hidden) fechar(); });
  conc.addEventListener('click', () => { P.dar(atual.id); fechar(); });

  PAGINAS.forEach((d) => {
    const b = document.createElement('button');
    b.className = 'licao desafio';
    b.innerHTML = '<span class="licao-titulo"></span><span class="licao-resumo"></span>';
    b.firstChild.textContent = d.titulo;
    b.lastChild.textContent = d.resumo;
    b.addEventListener('click', () => abrir(d));
    botoes.push([b, d]);
    lista.appendChild(b);
  });
  marcar();
  P.repintar();
})();
