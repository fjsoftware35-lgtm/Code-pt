/* Extras da Palavra: desafios com verificação, estrelas e dicionário para inglês */
(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const sem = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const nums = (s) => (String(s).match(/-?\d+(?:[.,]\d+)?/g) || []).map((x) => Number(x.replace(',', '.')));
  const tem = (saida, ...n) => n.every((x) => nums(saida).includes(x));

  const DESAFIOS = [
    { id: 'saudacao', titulo: 'Saudação', resumo: 'Perguntar o nome e cumprimentar.',
      enunciado: 'Pergunta o nome com ler() e escreve uma saudação com esse nome.',
      inicio: '# Pergunta o nome e cumprimenta a pessoa\n',
      testes: [{ entradas: ['Amina'], ok: (s) => sem(s).includes('amina') }, { entradas: ['Tomás'], ok: (s) => sem(s).includes('tomas') }] },
    { id: 'dobro', titulo: 'O dobro', resumo: 'Ler um número e mostrar o dobro.',
      enunciado: 'Lê um número e mostra o dobro dele. Dica: numero(ler("..."))',
      inicio: '# Lê um número e escreve o dobro\n',
      testes: [{ entradas: ['4'], ok: (s) => tem(s, 8) }, { entradas: ['21'], ok: (s) => tem(s, 42) }] },
    { id: 'contar', titulo: 'Contar até 5', resumo: 'Mostrar 1, 2, 3, 4, 5 com um ciclo.',
      enunciado: 'Mostra os números de 1 a 5, um por linha, usando "para".',
      inicio: '# Mostra de 1 a 5\n',
      testes: [{ entradas: [], ok: (s) => nums(s).join(',') === '1,2,3,4,5' }] },
    { id: 'parimpar', titulo: 'Par ou ímpar', resumo: 'Dizer se o número é par ou ímpar.',
      enunciado: 'Lê um número e escreve "par" ou "ímpar". Dica: o resto da divisão por 2 (%).',
      inicio: '# Lê um número e diz se é par ou ímpar\n',
      testes: [{ entradas: ['7'], ok: (s) => sem(s).includes('impar') }, { entradas: ['10'], ok: (s) => sem(s).includes('par') && !sem(s).includes('impar') }] },
    { id: 'troco', titulo: 'Troco', resumo: 'Calcular o troco de uma compra.',
      enunciado: 'Lê primeiro o valor pago e depois o preço (em meticais). Mostra o troco.',
      inicio: '# Lê o valor pago, depois o preço, e mostra o troco\n',
      testes: [{ entradas: ['100', '65'], ok: (s) => tem(s, 35) }, { entradas: ['50', '12'], ok: (s) => tem(s, 38) }] },
  ];

  // ---- progresso (localStorage com alternativa em memória)
  const CH = 'palavra.progresso.v1';
  let feitos = [];
  try { feitos = JSON.parse(localStorage.getItem(CH) || '[]'); } catch (e) { feitos = []; }
  const gravar = () => { try { localStorage.setItem(CH, JSON.stringify(feitos)); } catch (e) { /* sem armazenamento */ } };

  const topo = $('.topo');
  const estrelas = document.createElement('div');
  estrelas.className = 'estrelas';
  estrelas.title = 'Desafios concluídos';
  topo.insertBefore(estrelas, $('.acoes'));
  const pintarEstrelas = () => { estrelas.textContent = `⭐ ${feitos.length}/${DESAFIOS.length + (Palavra.totalPaginas || 0)}`; };

  function confetes() {
    const cores = ['#0d7656', '#e0a526', '#b9402c', '#7fc4d8', '#e795b9'];
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('i');
      c.className = 'confete';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = cores[i % cores.length];
      c.style.animationDelay = Math.random() * 0.4 + 's';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 2200);
    }
  }

  // ---- barra do desafio, por cima do editor
  const barra = document.createElement('div');
  barra.className = 'barra-desafio';
  barra.hidden = true;
  barra.innerHTML = '<div class="bd-texto"></div><div class="bd-linha"><button class="btn btn-correr bd-verificar">Verificar</button><span class="bd-resultado" role="status"></span></div>';
  $('#codigo').insertBefore(barra, $('#editor'));
  const bdTexto = barra.querySelector('.bd-texto');
  const bdRes = barra.querySelector('.bd-resultado');
  let atual = null;

  function abrir(d) {
    atual = d;
    $('#fonte').value = d.inicio;
    $('#fonte').dispatchEvent(new Event('input'));
    $('#tituloFicheiro').textContent = d.id + '.pal';
    bdTexto.textContent = '🎯 ' + d.enunciado;
    bdRes.textContent = '';
    bdRes.className = 'bd-resultado';
    barra.hidden = false;
    const b = document.querySelector('.separadores button[data-painel="codigo"]');
    if (b) b.click();
  }

  async function executar(codigo, entradas) {
    const linhas = [];
    const fila = entradas.slice();
    const it = new Palavra.Interpretador({
      escrever: (t) => linhas.push(t),
      ler: () => Promise.resolve(fila.length ? fila.shift() : ''),
      limpar: () => { linhas.length = 0; },
    });
    const relogio = setTimeout(() => it.parar(), 3000);
    try { await it.executar(codigo); } finally { clearTimeout(relogio); }
    return linhas.join('\n');
  }

  barra.querySelector('.bd-verificar').addEventListener('click', async () => {
    if (!atual) return;
    bdRes.className = 'bd-resultado';
    bdRes.textContent = 'A verificar…';
    try {
      for (const t of atual.testes) {
        const saida = await executar($('#fonte').value, t.entradas);
        if (!t.ok(saida)) {
          bdRes.className = 'bd-resultado mau';
          bdRes.textContent = t.entradas.length ? `❌ Ainda não. Com a resposta "${t.entradas.join('", "')}" o resultado não está certo.` : '❌ Ainda não. Confirma o que o programa escreve.';
          return;
        }
      }
      bdRes.className = 'bd-resultado bom';
      bdRes.textContent = '✅ Muito bem! Desafio concluído.';
      if (!feitos.includes(atual.id)) { feitos.push(atual.id); gravar(); pintarPontos(); confetes(); }
      pintarEstrelas();
    } catch (e) {
      bdRes.className = 'bd-resultado mau';
      bdRes.textContent = '❌ O programa tem um erro: ' + (e && e.message ? e.message : 'confirma o código.');
    }
  });

  // ---- lista de desafios
  const caixa = $('#desafios');
  const botoes = [];
  const pintarPontos = () => botoes.forEach(([b, d]) => b.classList.toggle('feito', feitos.includes(d.id)));
  DESAFIOS.forEach((d) => {
    const b = document.createElement('button');
    b.className = 'licao desafio';
    b.innerHTML = '<span class="licao-titulo"></span><span class="licao-resumo"></span>';
    b.firstChild.textContent = d.titulo;
    b.lastChild.textContent = d.resumo;
    b.addEventListener('click', () => abrir(d));
    botoes.push([b, d]);
    caixa.appendChild(b);
  });

  // ---- dicionário Palavra → inglês
  const DIC = [
    ['escrever(x)', 'print(x)', 'console.log(x)'], ['ler("?")', 'input("?")', 'prompt("?")'],
    ['se … entao … fim', 'if …:', 'if (…) { }'], ['senao', 'else:', 'else { }'],
    ['para i de 1 ate 3', 'for i in range(1, 4):', 'for (let i=1; i<=3; i++)'],
    ['enquanto … faca', 'while …:', 'while (…) { }'], ['funcao nome()', 'def nome():', 'function nome() { }'],
    ['retornar x', 'return x', 'return x'], ['verdadeiro / falso / nulo', 'True / False / None', 'true / false / null'],
    ['e / ou / nao', 'and / or / not', '&& / || / !'], ['tamanho(lista)', 'len(lista)', 'lista.length'],
    ['adicionar(lista, x)', 'lista.append(x)', 'lista.push(x)'], ['numero("5")', 'int("5")', 'Number("5")'],
    ['# comentário', '# comentário', '// comentário'],
  ];
  const ing = $('#ingles');
  const p = document.createElement('p');
  p.className = 'ref-intro';
  p.textContent = 'As ideias são as mesmas em todas as linguagens. Só mudam as palavras. Aqui vês como cada coisa se escreve em Python e em JavaScript. Em Python não há "fim": o bloco marca-se com espaços no início da linha.';
  ing.appendChild(p);
  const tab = document.createElement('table');
  tab.className = 'tab-ingles';
  tab.innerHTML = '<thead><tr><th>Palavra</th><th>Python</th><th>JavaScript</th></tr></thead>';
  const tb = document.createElement('tbody');
  DIC.forEach((l) => { const tr = document.createElement('tr'); l.forEach((c) => { const td = document.createElement('td'); td.textContent = c; tr.appendChild(td); }); tb.appendChild(tr); });
  tab.appendChild(tb);
  ing.appendChild(tab);

  Palavra.feito = (id) => feitos.includes(id);
  Palavra.dar = (id) => { if (!feitos.includes(id)) { feitos.push(id); gravar(); confetes(); } pintarEstrelas(); };
  Palavra.repintar = pintarEstrelas;
  pintarEstrelas();
  pintarPontos();
})();
