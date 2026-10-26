/* Tradutor Palavra → Python + botão "Ver em Python" */
(function () {
  'use strict';
  const P = window.Palavra;
  const PYRES = new Set(['class', 'def', 'lambda', 'import', 'from', 'is', 'in', 'not', 'pass', 'del', 'with', 'as', 'try', 'except', 'global', 'yield', 'print', 'input', 'len', 'str', 'int', 'list', 'dict', 'sum', 'max', 'min', 'range', 'type']);
  const SIMPLES = { escrever: 'print', mostrar: 'print', imprimir: 'print', ler: 'input', perguntar: 'input', lertexto: 'input', tamanho: 'len', numero: 'int', inteiro: 'int', texto: 'str', arredondar: 'round', absoluto: 'abs', maximo: 'max', minimo: 'min', soma: 'sum', ordenar: 'sorted', tipo: 'type' };
  const METODO = { maiusculas: 'upper', minusculas: 'lower', aparar: 'strip' };
  const PREC = { ou: 1, e: 2, nao: 3, cmp: 4, soma: 5, prod: 6, neg: 7, pot: 8, atom: 9 };

  function paraPython(codigo) {
    const arvore = new P.Analisador(P.analisarLexico(codigo)).programa();
    const usa = new Set(), avisos = new Set();
    const nome = (n) => (PYRES.has(n) ? n + '_' : n);

    function ex(n) {
      const t = n.tipo;
      if (t === 'Literal') {
        const v = n.valor;
        return [v === null ? 'None' : v === true ? 'True' : v === false ? 'False' : typeof v === 'string' ? JSON.stringify(v) : String(v), PREC.atom];
      }
      if (t === 'Var') return [nome(n.nome), PREC.atom];
      if (t === 'Lista') return ['[' + n.itens.map((i) => ex(i)[0]).join(', ') + ']', PREC.atom];
      if (t === 'Dicionario') return ['{' + n.pares.map(([k, v]) => JSON.stringify(k) + ': ' + ex(v)[0]).join(', ') + '}', PREC.atom];
      if (t === 'Indice') return [f(n.alvo, PREC.atom) + '[' + ex(n.indice)[0] + ']', PREC.atom];
      if (t === 'Membro') return [f(n.alvo, PREC.atom) + '.' + n.nome, PREC.atom];
      if (t === 'Nao') return ['not ' + f(n.expr, PREC.nao), PREC.nao];
      if (t === 'Neg') return ['-' + f(n.expr, PREC.neg), PREC.neg];
      if (t === 'Logico') { const p = PREC[n.op]; return [f(n.a, p) + ' ' + (n.op === 'e' ? 'and' : 'or') + ' ' + f(n.b, p + 1), p]; }
      if (t === 'Bin') {
        const o = n.op;
        if (o === '^') return [f(n.a, PREC.pot + 1) + ' ** ' + f(n.b, PREC.pot), PREC.pot];
        const p = ['+', '-'].includes(o) ? PREC.soma : ['*', '/', '%'].includes(o) ? PREC.prod : PREC.cmp;
        return [f(n.a, p) + ' ' + o + ' ' + f(n.b, p + 1), p];
      }
      if (t === 'Chamada') return chamada(n);
      return ['None', PREC.atom];
    }
    const f = (n, min) => { const [s, p] = ex(n); return p < min ? '(' + s + ')' : s; };

    function chamada(n) {
      const a = n.args.map((x) => ex(x)[0]);
      if (n.func.tipo === 'Var') {
        const k = n.func.nome;
        const at = (i) => f(n.args[i], PREC.atom);
        if (SIMPLES[k]) return [SIMPLES[k] + '(' + a.join(', ') + ')', PREC.atom];
        if (METODO[k] && a.length === 1) return [at(0) + '.' + METODO[k] + '()', PREC.atom];
        if (k === 'adicionar' && a.length === 2) return [at(0) + '.append(' + a[1] + ')', PREC.atom];
        if (k === 'inserir' && a.length === 3) return [at(0) + '.insert(' + a[1] + ', ' + a[2] + ')', PREC.atom];
        if (k === 'remover' && a.length === 2) return [at(0) + '.remove(' + a[1] + ')', PREC.atom];
        if (k === 'contem' && a.length === 2) return [f(n.args[1], PREC.cmp + 1) + ' in ' + f(n.args[0], PREC.cmp + 1), PREC.cmp];
        if (k === 'juntar' && a.length === 2) return ['str(' + a[1] + ').join(map(str, ' + a[0] + '))', PREC.atom];
        if (k === 'dividir' && a.length === 2) return [at(0) + '.split(' + a[1] + ')', PREC.atom];
        if (k === 'substituir' && a.length === 3) return [at(0) + '.replace(' + a[1] + ', ' + a[2] + ')', PREC.atom];
        if (k === 'posicao' && a.length === 2) return [at(0) + '.index(' + a[1] + ')', PREC.atom];
        if (k === 'inverter' && a.length === 1) return ['list(reversed(' + a[0] + '))', PREC.atom];
        if (k === 'lernumero') return ['int(input(' + a.join(', ') + '))', PREC.atom];
        if (k === 'raiz') { usa.add('math'); return ['math.sqrt(' + a.join(', ') + ')', PREC.atom]; }
        if (k === 'potencia' && a.length === 2) return [f(n.args[0], PREC.pot + 1) + ' ** ' + f(n.args[1], PREC.pot), PREC.pot];
        if (k === 'aleatorio') { usa.add('random'); return [a.length === 2 ? 'random.randint(' + a.join(', ') + ')' : 'random.random()', PREC.atom]; }
        if (k === 'esperar') { usa.add('time'); return ['time.sleep(' + a.join(', ') + ')', PREC.atom]; }
        if (['limpar', 'formatar', 'parte', 'chaves', 'valores', 'media', 'sequencia', 'hora', 'data', 'ano', 'ehnumero'].includes(k)) avisos.add(k);
      }
      return [f(n.func, PREC.atom) + '(' + a.join(', ') + ')', PREC.atom];
    }

    const out = [];
    const L = (d, s) => out.push('    '.repeat(d) + s);
    function bloco(ns, d) {
      if (!ns || !ns.length) { L(d, 'pass'); return; }
      ns.forEach((s) => stmt(s, d));
    }
    function se(n, d, palavra) {
      L(d, palavra + ' ' + ex(n.cond)[0] + ':');
      bloco(n.entao, d + 1);
      if (n.senao && n.senao.length === 1 && n.senao[0].tipo === 'Se') se(n.senao[0], d, 'elif');
      else if (n.senao) { L(d, 'else:'); bloco(n.senao, d + 1); }
    }
    function stmt(n, d) {
      switch (n.tipo) {
        case 'Declarar': return L(d, nome(n.nome) + ' = ' + ex(n.valor)[0]);
        case 'Atribuir': return L(d, ex(n.alvo)[0] + ' ' + n.op + ' ' + ex(n.valor)[0]);
        case 'Expr': return L(d, ex(n.expr)[0]);
        case 'Se': return se(n, d, 'if');
        case 'Enquanto': L(d, 'while ' + ex(n.cond)[0] + ':'); return bloco(n.corpo, d + 1);
        case 'Repetir': L(d, 'for _ in range(' + ex(n.vezes)[0] + '):'); return bloco(n.corpo, d + 1);
        case 'ParaCada': L(d, 'for ' + nome(n.nome) + ' in ' + ex(n.lista)[0] + ':'); return bloco(n.corpo, d + 1);
        case 'Para': {
          const neg = n.passo && n.passo.tipo === 'Neg';
          const fim = n.final.tipo === 'Literal' && typeof n.final.valor === 'number' ? String(n.final.valor + (neg ? -1 : 1)) : f(n.final, PREC.soma) + (neg ? ' - 1' : ' + 1');
          L(d, 'for ' + nome(n.nome) + ' in range(' + ex(n.inicio)[0] + ', ' + fim + (n.passo ? ', ' + ex(n.passo)[0] : '') + '):');
          return bloco(n.corpo, d + 1);
        }
        case 'DeclFuncao': L(d, 'def ' + nome(n.nome) + '(' + n.params.map(nome).join(', ') + '):'); return bloco(n.corpo, d + 1);
        case 'Retornar': return L(d, n.valor ? 'return ' + ex(n.valor)[0] : 'return');
        case 'Interromper': return L(d, 'break');
        case 'Continuar': return L(d, 'continue');
        default: return L(d, 'pass');
      }
    }
    bloco(arvore, 0);
    const cab = [...usa].map((m) => 'import ' + m);
    return { codigo: (cab.length ? cab.join('\n') + '\n\n' : '') + out.join('\n') + '\n', avisos: [...avisos] };
  }
  P.paraPython = paraPython;

  if (typeof document === 'undefined') return;
  // ---- interface
  const acoes = document.querySelector('.acoes');
  const btn = document.createElement('button');
  btn.className = 'btn btn-py';
  btn.innerHTML = '🐍<span class="py-t"> Python</span>';
  btn.title = 'Ver este programa escrito em Python';
  acoes.appendChild(btn);
  const fundo = document.createElement('div');
  fundo.className = 'py-fundo';
  fundo.hidden = true;
  fundo.innerHTML = '<div class="py-caixa" role="dialog" aria-label="Programa em Python"><div class="py-topo"><strong>🐍 O teu programa em Python</strong><button class="py-fechar" aria-label="Fechar">✕</button></div><p class="py-nota">Python é uma linguagem real, usada no mundo inteiro. Compara linha a linha com o teu programa.</p><pre class="py-codigo"></pre><p class="py-avisos"></p><button class="btn btn-correr py-copiar">Copiar</button></div>';
  document.body.appendChild(fundo);
  const cod = fundo.querySelector('.py-codigo');
  const av = fundo.querySelector('.py-avisos');
  const fechar = () => { fundo.hidden = true; };
  fundo.querySelector('.py-fechar').addEventListener('click', fechar);
  fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
  fundo.querySelector('.py-copiar').addEventListener('click', async (e) => {
    try { await navigator.clipboard.writeText(cod.textContent); e.target.textContent = 'Copiado ✓'; } catch (x) { e.target.textContent = 'Seleciona e copia à mão'; }
    setTimeout(() => { e.target.textContent = 'Copiar'; }, 1800);
  });
  btn.addEventListener('click', () => {
    av.textContent = '';
    try {
      const r = paraPython(document.querySelector('#fonte').value);
      cod.textContent = r.codigo;
      if (r.avisos.length) av.textContent = 'Nota: ' + r.avisos.join(', ') + ' não tem equivalente direto em Python.';
    } catch (e) {
      cod.textContent = '';
      av.textContent = 'Corrige primeiro o erro do programa: ' + (e && e.message ? e.message : 'confirma o código.');
    }
    fundo.hidden = false;
  });
})();
