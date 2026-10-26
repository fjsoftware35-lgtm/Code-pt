(function () {
  'use strict';
  const $ = (s) => document.querySelector(s);

  const fonte = $('#fonte');
  const realce = $('#realce');
  const camada = $('#camada');
  const numeros = $('#numeros');
  const marcaErro = $('#marcaErro');
  const saida = $('#saida');
  const entrada = $('#entrada');
  const resposta = $('#resposta');
  const perguntaRotulo = $('#perguntaRotulo');
  const estado = $('#estado');
  const btnCorrer = $('#btnCorrer');
  const btnParar = $('#btnParar');
  const tituloFicheiro = $('#tituloFicheiro');
  const pontoConsola = $('#pontoConsola');

  const CHAVE = 'palavra.codigo.v1';
  // memória da sessão (para guardar de forma permanente, usa o botão de descarregar)
  const memoria = new Map();
  const guardar = (k, v) => memoria.set(k, v);
  const carregar = (k) => (memoria.has(k) ? memoria.get(k) : null);

  const INICIAL = `# Bem-vindo à Palavra!
# Aqui escreves programas em português.
# Carrega em Executar (ou Ctrl + Enter) para ver o resultado.

nome = ler("Como te chamas?")
escrever("Olá,", nome + "! Vamos aprender a programar.")

para i de 1 até 3 faça
  escrever("Contagem:", i)
fim

# Escolhe uma lição à esquerda para aprender mais.`;

  // ------------------------------------------------------------ Realce
  const semAcentos = Palavra.semAcentos;
  const PC = new Set(['se', 'senao', 'entao', 'fim', 'enquanto', 'faca', 'para', 'de', 'ate', 'passo', 'cada', 'em', 'funcao', 'retornar', 'retorna', 'repetir', 'vezes', 'interromper', 'continuar', 'variavel', 'var']);
  const LOG = new Set(['e', 'ou', 'nao', 'mod', 'verdadeiro', 'falso', 'nulo']);
  const FN = new Set([...new Palavra.Interpretador().nativas.vars.keys()].map((k) => k.toLowerCase()));
  const RE = /(\/\/[^\n]*|#[^\n]*)|("[^"\\\n]*(?:\\.[^"\\\n]*)*"?|'[^'\\\n]*(?:\\.[^'\\\n]*)*'?|“[^”“\n]*[”“]?)|(\d+(?:\.\d+)?)|([\p{L}_][\p{L}\p{N}_]*)|([+\-*/%^=<>!≠≤≥]+)/gu;
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function realcar(src) {
    let html = '', ultimo = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(src))) {
      html += esc(src.slice(ultimo, m.index));
      const t = esc(m[0]);
      if (m[1]) html += `<span class="t-com">${t}</span>`;
      else if (m[2]) html += `<span class="t-txt">${t}</span>`;
      else if (m[3]) html += `<span class="t-num">${t}</span>`;
      else if (m[4]) {
        const n = semAcentos(m[4]).toLowerCase();
        const proximo = src.slice(RE.lastIndex).match(/^\s*\(/);
        if (PC.has(n)) html += `<span class="t-pc">${t}</span>`;
        else if (LOG.has(n)) html += `<span class="t-log">${t}</span>`;
        else if (FN.has(n) && (proximo || /^\s+["'\w]/u.test(src.slice(RE.lastIndex)))) html += `<span class="t-fn">${t}</span>`;
        else html += t;
      } else html += `<span class="t-op">${t}</span>`;
      ultimo = RE.lastIndex;
    }
    html += esc(src.slice(ultimo));
    return html + '\n';
  }

  let totalLinhas = 0;
  function atualizarEditor() {
    const v = fonte.value;
    realce.innerHTML = realcar(v);
    const n = v.split('\n').length;
    if (n !== totalLinhas) {
      totalLinhas = n;
      let h = '';
      for (let i = 1; i <= n; i++) h += `<span data-l="${i}">${i}</span>`;
      numeros.innerHTML = `<div class="numeros-int">${h}</div>`;
      if (linhaErro) marcarLinha(linhaErro);
    }
    sincronizar();
  }

  function sincronizar() {
    camada.style.transform = `translate(${-fonte.scrollLeft}px, ${-fonte.scrollTop}px)`;
    const int = numeros.firstElementChild;
    if (int) int.style.transform = `translateY(${-fonte.scrollTop}px)`;
  }

  let temporizadorGuardar;
  fonte.addEventListener('input', () => {
    if (linhaErro) limparErro();
    atualizarEditor();
    clearTimeout(temporizadorGuardar);
    temporizadorGuardar = setTimeout(() => guardar(CHAVE, fonte.value), 300);
  });
  fonte.addEventListener('scroll', sincronizar);

  function inserir(texto) {
    fonte.focus();
    const ok = document.execCommand && document.execCommand('insertText', false, texto);
    if (!ok) {
      fonte.setRangeText(texto, fonte.selectionStart, fonte.selectionEnd, 'end');
      fonte.dispatchEvent(new Event('input'));
    }
  }

  const ABRE_BLOCO = /^\s*(se|senao|senão|enquanto|para|repetir|funcao|função)\b/i;
  fonte.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); correr(); return; }
    if (e.key === 'Tab' && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      if (e.shiftKey) {
        const ini = fonte.value.lastIndexOf('\n', fonte.selectionStart - 1) + 1;
        if (fonte.value.startsWith('  ', ini)) {
          const s = fonte.selectionStart;
          fonte.setSelectionRange(ini, ini + 2);
          inserir('');
          fonte.setSelectionRange(Math.max(ini, s - 2), Math.max(ini, s - 2));
        }
      } else inserir('  ');
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      let pos = fonte.selectionStart;
      const ini = fonte.value.lastIndexOf('\n', pos - 1) + 1;
      let linha = fonte.value.slice(ini, pos);
      // "fim" e "senão" recuam automaticamente
      if (/^ {2,}(fim|senao)\b/i.test(semAcentos(linha)) && fonte.selectionStart === fonte.selectionEnd) {
        fonte.setSelectionRange(ini, ini + 2);
        inserir('');
        pos -= 2;
        fonte.setSelectionRange(pos, pos);
        linha = linha.slice(2);
      }
      let recuo = linha.match(/^\s*/)[0];
      if (ABRE_BLOCO.test(semAcentos(linha))) recuo += '  ';
      e.preventDefault();
      inserir('\n' + recuo);
    }
  });

  // ------------------------------------------------------------ Consola
  const MAX_LINHAS = 3000;
  let vazia = true;
  function limparSaida() {
    saida.innerHTML = '';
    vazia = true;
  }
  function linha(texto, classe = '') {
    if (vazia) { saida.innerHTML = ''; vazia = false; }
    const d = document.createElement('div');
    d.className = 'l ' + classe;
    d.textContent = texto;
    saida.appendChild(d);
    while (saida.childElementCount > MAX_LINHAS) saida.firstElementChild.remove();
    saida.scrollTop = saida.scrollHeight;
    if (painelAtual !== 'consola' && ehMovel()) pontoConsola.hidden = false;
    return d;
  }
  function sistema(t) { linha(t, 'l-sistema'); }

  function mostrarErro(e) {
    if (vazia) { saida.innerHTML = ''; vazia = false; }
    const d = document.createElement('div');
    d.className = 'l l-erro';
    const tit = document.createElement('strong');
    const tipo = e.tipo && e.tipo !== 'Erro' ? e.tipo : 'Erro';
    tit.textContent = e.linha ? `${tipo} na linha ${e.linha}` : tipo;
    const msg = document.createElement('span');
    msg.textContent = e.message;
    d.append(tit, msg);
    if (e.linha) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Ir para a linha ' + e.linha;
      b.addEventListener('click', () => irParaLinha(e.linha));
      d.append(document.createElement('br'), b);
      marcarLinha(e.linha);
    }
    saida.appendChild(d);
    saida.scrollTop = saida.scrollHeight;
  }

  let linhaErro = 0;
  function alturaLinha() { return parseFloat(getComputedStyle(fonte).lineHeight) || 24; }
  function marcarLinha(l) {
    linhaErro = l;
    const h = alturaLinha();
    const topoPad = parseFloat(getComputedStyle(fonte).paddingTop) || 14;
    marcaErro.style.top = topoPad + (l - 1) * h + 'px';
    marcaErro.style.height = h + 'px';
    marcaErro.hidden = false;
    numeros.querySelectorAll('.erro').forEach((s) => s.classList.remove('erro'));
    const s = numeros.querySelector(`[data-l="${l}"]`);
    if (s) s.classList.add('erro');
  }
  function limparErro() {
    linhaErro = 0;
    marcaErro.hidden = true;
    numeros.querySelectorAll('.erro').forEach((s) => s.classList.remove('erro'));
  }
  function irParaLinha(l) {
    mostrarPainel('codigo');
    const linhas = fonte.value.split('\n');
    let pos = 0;
    for (let i = 0; i < l - 1 && i < linhas.length; i++) pos += linhas[i].length + 1;
    fonte.focus();
    fonte.setSelectionRange(pos, pos + (linhas[l - 1] || '').length);
    const h = alturaLinha();
    fonte.scrollTop = Math.max(0, (l - 1) * h - fonte.clientHeight / 3);
    sincronizar();
  }

  // ------------------------------------------------------------ Execução
  let interp = null;
  let pendente = null;

  function definirEstado(texto, classe = '') {
    estado.textContent = texto;
    estado.className = 'estado ' + classe;
  }

  function pedir(pergunta) {
    return new Promise((resolver) => {
      if (pergunta) linha(pergunta, 'l-pergunta');
      perguntaRotulo.textContent = pergunta || 'O programa está à espera de uma resposta';
      entrada.hidden = false;
      resposta.value = '';
      definirEstado('À espera da tua resposta', 'a-correr');
      if (ehMovel()) mostrarPainel('consola');
      resposta.focus();
      saida.scrollTop = saida.scrollHeight;
      pendente = resolver;
    });
  }

  entrada.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pendente) return;
    const v = resposta.value;
    linha(v, 'l-resposta');
    entrada.hidden = true;
    definirEstado('A executar…', 'a-correr');
    const r = pendente;
    pendente = null;
    r(v);
  });

  async function correr() {
    if (interp) return;
    limparErro();
    limparSaida();
    btnCorrer.disabled = true;
    btnParar.disabled = false;
    definirEstado('A executar…', 'a-correr');
    if (ehMovel()) mostrarPainel('consola');
    interp = new Palavra.Interpretador({
      escrever: (t) => linha(t),
      ler: pedir,
      limpar: limparSaida,
    });
    const t0 = performance.now();
    try {
      await interp.executar(fonte.value);
      const ms = Math.round(performance.now() - t0);
      sistema(`Programa terminado${ms < 1000 ? ` em ${ms} ms` : ` em ${(ms / 1000).toFixed(1).replace('.', ',')} s`}.`);
      definirEstado('Terminado');
    } catch (e) {
      if (e && e.tipo === 'Parado') {
        sistema('Programa parado por ti.');
        definirEstado('Parado');
      } else if (e instanceof Palavra.ErroPalavra) {
        mostrarErro(e);
        definirEstado('Com erro', 'erro');
      } else {
        console.error(e);
        mostrarErro({ message: 'Aconteceu um problema inesperado: ' + (e && e.message ? e.message : e), tipo: 'Erro' });
        definirEstado('Com erro', 'erro');
      }
    } finally {
      interp = null;
      pendente = null;
      entrada.hidden = true;
      btnCorrer.disabled = false;
      btnParar.disabled = true;
    }
  }

  function parar() {
    if (!interp) return;
    interp.parar();
    if (pendente) {
      const r = pendente;
      pendente = null;
      entrada.hidden = true;
      r('');
    }
  }

  btnCorrer.addEventListener('click', correr);
  btnParar.addEventListener('click', parar);
  $('#btnLimpar').addEventListener('click', () => {
    limparSaida();
    saida.innerHTML = '<p class="vazio">Consola limpa.</p>';
    vazia = true;
  });
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && e.target !== fonte) { e.preventDefault(); correr(); }
    if (e.key === 'Escape' && interp) parar();
  });

  // ------------------------------------------------------------ Ficheiros
  function definirCodigo(codigo, nome) {
    fonte.value = codigo;
    tituloFicheiro.textContent = nome || 'programa.pal';
    fonte.scrollTop = 0; fonte.scrollLeft = 0;
    limparErro();
    atualizarEditor();
    guardar(CHAVE, codigo);
    guardar(CHAVE + '.nome', tituloFicheiro.textContent);
  }

  $('#btnNovo').addEventListener('click', () => {
    definirCodigo('# O meu programa\n\n', 'programa.pal');
    marcarLicaoAtiva(null);
    mostrarPainel('codigo');
    fonte.focus();
    fonte.setSelectionRange(fonte.value.length, fonte.value.length);
  });
  const inputFicheiro = $('#ficheiro');
  $('#btnAbrir').addEventListener('click', () => inputFicheiro.click());
  inputFicheiro.addEventListener('change', () => {
    const f = inputFicheiro.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { definirCodigo(String(r.result), f.name); marcarLicaoAtiva(null); mostrarPainel('codigo'); };
    r.readAsText(f);
    inputFicheiro.value = '';
  });
  $('#btnGuardar').addEventListener('click', () => {
    const nome = tituloFicheiro.textContent.endsWith('.pal') ? tituloFicheiro.textContent : 'programa.pal';
    const blob = new Blob([fonte.value], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  });

  // ------------------------------------------------------------ Lições e referência
  const nomeFicheiro = (t) => semAcentos(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.pal';
  const caixaLicoes = $('#licoes');
  const botoesLicao = [];
  LICOES.forEach((g) => {
    const h = document.createElement('div');
    h.className = 'grupo-titulo';
    h.textContent = g.grupo;
    caixaLicoes.appendChild(h);
    g.itens.forEach((l) => {
      const b = document.createElement('button');
      b.className = 'licao';
      b.innerHTML = `<span class="licao-titulo"></span><span class="licao-resumo"></span>`;
      b.firstChild.textContent = l.titulo;
      b.lastChild.textContent = l.resumo;
      b.addEventListener('click', () => {
        definirCodigo(l.codigo, nomeFicheiro(l.titulo));
        marcarLicaoAtiva(b);
        mostrarPainel('codigo');
      });
      b.dataset.titulo = l.titulo;
      botoesLicao.push(b);
      caixaLicoes.appendChild(b);
    });
  });
  function marcarLicaoAtiva(b) {
    botoesLicao.forEach((x) => x.classList.toggle('ativo', x === b));
  }

  const caixaRef = $('#referencia');
  function tabela(linhas, classe = '') {
    const t = document.createElement('table');
    t.className = 'ref-tabela ' + classe;
    const tb = document.createElement('tbody');
    linhas.forEach(([a, b]) => {
      const tr = document.createElement('tr');
      const c1 = document.createElement('td'); c1.textContent = a;
      const c2 = document.createElement('td'); c2.textContent = b;
      tr.append(c1, c2);
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return t;
  }
  function tituloRef(t) {
    const h = document.createElement('div');
    h.className = 'grupo-titulo';
    h.textContent = t;
    caixaRef.appendChild(h);
  }
  const intro = document.createElement('p');
  intro.className = 'ref-intro';
  intro.textContent = 'Os acentos são opcionais: podes escrever "então" ou "entao", "função" ou "funcao". Cada bloco termina com "fim".';
  caixaRef.appendChild(intro);
  tituloRef('Palavras da linguagem');
  caixaRef.appendChild(tabela(REFERENCIA.palavras));
  tituloRef('Operadores');
  caixaRef.appendChild(tabela(REFERENCIA.operadores));
  REFERENCIA.funcoes.forEach(([g, fs]) => {
    tituloRef(g);
    caixaRef.appendChild(tabela(fs, 'funcoes'));
  });

  document.querySelectorAll('.aba').forEach((b) => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.aba').forEach((x) => {
        const ativo = x === b;
        x.classList.toggle('ativo', ativo);
        x.setAttribute('aria-selected', ativo);
        $('#' + x.dataset.aba).hidden = !ativo;
      });
    });
  });

  // ------------------------------------------------------------ Painéis (telemóvel)
  const mq = window.matchMedia('(max-width: 900px)');
  const ehMovel = () => mq.matches;
  let painelAtual = 'codigo';
  function mostrarPainel(p) {
    painelAtual = p;
    document.querySelectorAll('.separadores button').forEach((b) => b.classList.toggle('ativo', b.dataset.painel === p));
    ['aprender', 'codigo', 'consola'].forEach((id) => $('#' + id).classList.toggle('visivel', id === p));
    if (p === 'consola') pontoConsola.hidden = true;
    if (p === 'codigo') requestAnimationFrame(sincronizar);
  }
  document.querySelectorAll('.separadores button').forEach((b) => b.addEventListener('click', () => mostrarPainel(b.dataset.painel)));
  mostrarPainel('codigo');

  // ------------------------------------------------------------ Início
  const guardado = carregar(CHAVE);
  fonte.value = guardado !== null && guardado.trim() !== '' ? guardado : INICIAL;
  tituloFicheiro.textContent = carregar(CHAVE + '.nome') || 'programa.pal';
  const ativa = botoesLicao.find((b) => b.dataset.titulo && LICOES.some((g) => g.itens.some((l) => l.titulo === b.dataset.titulo && l.codigo === fonte.value)));
  if (ativa) marcarLicaoAtiva(ativa);
  atualizarEditor();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (linhaErro) marcarLinha(linhaErro); sincronizar(); });
})();
