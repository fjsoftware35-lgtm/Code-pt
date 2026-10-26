/* Palavra — uma linguagem de programação em português.
   Lexer, parser e interpretador (assíncrono, para permitir ler() e esperar()). */
(function (global) {
  'use strict';

  const semAcentos = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Palavras reservadas (não podem ser nomes de variáveis)
  const RESERVADAS = new Set([
    'se', 'senao', 'fim', 'enquanto', 'para', 'funcao', 'retornar', 'retorna',
    'e', 'ou', 'nao', 'verdadeiro', 'falso', 'nulo', 'interromper', 'continuar',
    'variavel', 'var', 'repetir', 'mod',
  ]);
  // Palavras em inglês aceites (o Palavra entende as duas línguas)
  const ALIAS = {
    if: 'se', else: 'senao', end: 'fim', while: 'enquanto', for: 'para', function: 'funcao', def: 'funcao', return: 'retornar',
    and: 'e', or: 'ou', not: 'nao', true: 'verdadeiro', false: 'falso', null: 'nulo', none: 'nulo', break: 'interromper', continue: 'continuar',
    repeat: 'repetir', then: 'entao', do: 'faca', from: 'de', to: 'ate', step: 'passo', each: 'cada', in: 'em', times: 'vezes',
    print: 'escrever', input: 'ler', len: 'tamanho', length: 'tamanho', int: 'inteiro', str: 'texto', number: 'numero', float: 'numero',
    round: 'arredondar', abs: 'absoluto', max: 'maximo', min: 'minimo', sum: 'soma', sort: 'ordenar', sorted: 'ordenar',
    reverse: 'inverter', append: 'adicionar', add: 'adicionar', insert: 'inserir', remove: 'remover', contains: 'contem',
    index: 'posicao', join: 'juntar', split: 'dividir', upper: 'maiusculas', lower: 'minusculas', strip: 'aparar', trim: 'aparar',
    replace: 'substituir', sqrt: 'raiz', pow: 'potencia', power: 'potencia', random: 'aleatorio', sleep: 'esperar', wait: 'esperar',
    type: 'tipo', keys: 'chaves', values: 'valores', clear: 'limpar', average: 'media',
  };
  // Português → inglês preferido (para converter o programa do aluno)
  const PARA_EN = {
    se: 'if', senao: 'else', fim: 'end', enquanto: 'while', para: 'for', funcao: 'function', retornar: 'return', retorna: 'return',
    e: 'and', ou: 'or', nao: 'not', verdadeiro: 'true', falso: 'false', nulo: 'null', interromper: 'break', continuar: 'continue',
    repetir: 'repeat', entao: 'then', faca: 'do', de: 'from', ate: 'to', passo: 'step', cada: 'each', em: 'in', vezes: 'times',
    escrever: 'print', mostrar: 'print', imprimir: 'print', ler: 'input', tamanho: 'len', inteiro: 'int', texto: 'str', numero: 'number',
    arredondar: 'round', absoluto: 'abs', maximo: 'max', minimo: 'min', soma: 'sum', ordenar: 'sort', inverter: 'reverse',
    adicionar: 'append', inserir: 'insert', remover: 'remove', contem: 'contains', posicao: 'index', juntar: 'join', dividir: 'split',
    maiusculas: 'upper', minusculas: 'lower', aparar: 'trim', substituir: 'replace', raiz: 'sqrt', potencia: 'pow',
    aleatorio: 'random', esperar: 'sleep', tipo: 'type', chaves: 'keys', valores: 'values', limpar: 'clear', media: 'average',
  };

  // Palavras de contexto (só têm significado especial em certos lugares)
  const CONTEXTO = ['entao', 'faca', 'de', 'ate', 'passo', 'cada', 'em', 'vezes'];

  class ErroPalavra extends Error {
    constructor(mensagem, linha, tipo = 'Erro') {
      super(mensagem);
      this.linha = linha;
      this.tipo = tipo;
    }
  }

  // ---------------------------------------------------------------- Lexer
  function analisarLexico(src) {
    const toks = [];
    let i = 0, linha = 1, prof = 0;
    const push = (tipo, valor, l = linha, bruto) => toks.push({ tipo, valor, linha: l, bruto });
    const ehLetra = (c) => /[\p{L}_]/u.test(c);
    const ehLetraNum = (c) => /[\p{L}\p{N}_]/u.test(c);
    const OPS = ['==', '!=', '<>', '<=', '>=', '+=', '-=', '*=', '/=', '<', '>', '=', '+', '-', '*', '/', '%', '^', '(', ')', '[', ']', '{', '}', ',', '.', ':', '≠', '≤', '≥', '×', '÷'];

    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { if (prof === 0) push('NL'); linha++; i++; continue; }
      if (c === ' ' || c === '\t' || c === '\r' || c === '\u00a0') { i++; continue; }
      if (c === ';') { if (prof === 0) push('NL'); i++; continue; }
      if (c === '#' || (c === '/' && src[i + 1] === '/')) {
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }
      if (/[0-9]/.test(c)) {
        let j = i;
        while (j < src.length && /[0-9]/.test(src[j])) j++;
        if (src[j] === '.' && /[0-9]/.test(src[j + 1] || '')) {
          j++;
          while (j < src.length && /[0-9]/.test(src[j])) j++;
        }
        push('NUM', parseFloat(src.slice(i, j)));
        i = j;
        continue;
      }
      if (c === '"' || c === "'" || c === '“' || c === '”') {
        const fechos = c === "'" ? ["'"] : c === '"' ? ['"'] : ['“', '”'];
        const l0 = linha;
        let j = i + 1, s = '';
        while (true) {
          if (j >= src.length || src[j] === '\n') {
            throw new ErroPalavra('O texto começado aqui não foi fechado. Falta a aspa ' + fechos[fechos.length - 1] + ' no fim.', l0, 'Erro de escrita');
          }
          const d = src[j];
          if (fechos.includes(d)) break;
          if (d === '\\') {
            const n = src[j + 1];
            s += n === 'n' ? '\n' : n === 't' ? '\t' : n;
            j += 2;
            continue;
          }
          s += d;
          j++;
        }
        push('TXT', s, l0);
        i = j + 1;
        continue;
      }
      if (ehLetra(c)) {
        let j = i;
        while (j < src.length && ehLetraNum(src[j])) j++;
        const bruto = src.slice(i, j);
        let norm = semAcentos(bruto);
        let minus = norm.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(ALIAS, minus)) norm = minus = ALIAS[minus];
        if (RESERVADAS.has(minus)) push('PC', minus, linha, bruto);
        else push('ID', norm, linha, bruto);
        i = j;
        continue;
      }
      const op = OPS.find((o) => src.startsWith(o, i));
      if (op) {
        let v = op;
        if (v === '<>' || v === '≠') v = '!=';
        if (v === '≤') v = '<=';
        if (v === '≥') v = '>=';
        if (v === '×') v = '*';
        if (v === '÷') v = '/';
        if ('([{'.includes(v)) prof++;
        if (')]}'.includes(v)) prof = Math.max(0, prof - 1);
        push('OP', v);
        i += op.length;
        continue;
      }
      throw new ErroPalavra(`Não reconheço o símbolo "${c}".`, linha, 'Erro de escrita');
    }
    push('NL');
    push('FIM_FICHEIRO');
    return toks;
  }

  function descrever(t) {
    if (!t) return 'o fim do programa';
    switch (t.tipo) {
      case 'NL': return 'o fim da linha';
      case 'FIM_FICHEIRO': return 'o fim do programa';
      case 'NUM': return `o número ${t.valor}`;
      case 'TXT': return `o texto "${t.valor}"`;
      case 'PC': return `a palavra "${t.bruto || t.valor}"`;
      case 'ID': return `"${t.bruto || t.valor}"`;
      default: return `"${t.valor}"`;
    }
  }

  // ---------------------------------------------------------------- Parser
  class Analisador {
    constructor(toks) { this.t = toks; this.p = 0; this.emCond = false; }
    get atual() { return this.t[this.p]; }
    get seguinte() { return this.t[this.p + 1]; }
    ver(tipo, valor) { const k = this.atual; return k.tipo === tipo && (valor === undefined || k.valor === valor); }
    pc(v) { return this.ver('PC', v); }
    ctx(v) { const k = this.atual; return k.tipo === 'ID' && k.valor.toLowerCase() === v; }
    op(v) { return this.ver('OP', v); }
    avancar() { return this.t[this.p++]; }
    erro(msg, t = this.atual) { return new ErroPalavra(msg, t.linha, 'Erro de escrita'); }
    esperarOp(v, msg) {
      if (this.op(v)) return this.avancar();
      throw this.erro(msg || `Esperava "${v}" mas encontrei ${descrever(this.atual)}.`);
    }
    esperarNome(msg) {
      if (this.ver('ID')) return this.avancar();
      if (this.ver('PC')) throw this.erro(`"${this.atual.bruto}" é uma palavra reservada da linguagem e não pode ser usada como nome.`);
      throw this.erro(msg);
    }
    saltarNL() { while (this.ver('NL')) this.avancar(); }

    programa() {
      const corpo = this.bloco([]);
      if (!this.ver('FIM_FICHEIRO')) {
        if (this.pc('fim')) throw this.erro('Este "fim" está a mais: não há nenhum bloco aberto para fechar.');
        if (this.pc('senao')) throw this.erro('Este "senao" não tem um "se" antes.');
        throw this.erro(`Não esperava ${descrever(this.atual)} aqui.`);
      }
      return corpo;
    }

    bloco(terminadores) {
      const lista = [];
      const ehTerminador = () => terminadores.some((t) => this.pc(t)) || (terminadores.length === 0 && (this.pc('fim') || this.pc('senao')));
      this.saltarNL();
      while (!this.ver('FIM_FICHEIRO') && !ehTerminador()) {
        lista.push(this.instrucao());
        if (!this.ver('NL') && !this.ver('FIM_FICHEIRO') && !ehTerminador()) {
          throw this.erro(`Esperava o fim da linha, mas encontrei ${descrever(this.atual)}.`);
        }
        this.saltarNL();
      }
      return lista;
    }

    fecharFim(nome, linha) {
      if (!this.pc('fim')) {
        throw new ErroPalavra(`Falta o "fim" para fechar o "${nome}" que começou na linha ${linha}.`, linha, 'Erro de escrita');
      }
      this.avancar();
      // aceita "fim se", "fim enquanto", "fim para", "fim funcao", "fim repetir"
      if (['se', 'enquanto', 'para', 'funcao', 'repetir'].some((p) => this.pc(p))) this.avancar();
    }

    instrucao() {
      const k = this.atual, l = k.linha;
      if (this.pc('variavel') || this.pc('var')) {
        this.avancar();
        const nome = this.esperarNome('Depois de "variavel" escreve o nome da variável. Exemplo: variavel idade = 20').valor;
        let valor = { tipo: 'Literal', valor: null, linha: l };
        if (this.op('=')) { this.avancar(); valor = this.expressao(); }
        return { tipo: 'Declarar', nome, valor, linha: l };
      }
      if (this.pc('se')) { this.avancar(); return this.seResto(l); }
      if (this.pc('enquanto')) {
        this.avancar();
        const cond = this.condicao();
        if (this.ctx('faca')) this.avancar();
        const corpo = this.bloco(['fim']);
        this.fecharFim('enquanto', l);
        return { tipo: 'Enquanto', cond, corpo, linha: l };
      }
      if (this.pc('para')) return this.para();
      if (this.pc('repetir')) {
        this.avancar();
        const vezes = this.expressao();
        if (!this.ctx('vezes')) throw this.erro('Esperava a palavra "vezes". Exemplo: repetir 3 vezes');
        this.avancar();
        const corpo = this.bloco(['fim']);
        this.fecharFim('repetir', l);
        return { tipo: 'Repetir', vezes, corpo, linha: l };
      }
      if (this.pc('funcao')) {
        this.avancar();
        const nome = this.esperarNome('Depois de "funcao" escreve o nome da função. Exemplo: funcao somar(a, b)').valor;
        const params = this.parametros();
        const corpo = this.bloco(['fim']);
        this.fecharFim('funcao', l);
        return { tipo: 'DeclFuncao', nome, params, corpo, linha: l };
      }
      if (this.pc('retornar') || this.pc('retorna')) {
        this.avancar();
        let valor = null;
        if (!this.ver('NL') && !this.ver('FIM_FICHEIRO') && !this.pc('fim')) valor = this.expressao();
        return { tipo: 'Retornar', valor, linha: l };
      }
      if (this.pc('interromper')) { this.avancar(); return { tipo: 'Interromper', linha: l }; }
      if (this.pc('continuar')) { this.avancar(); return { tipo: 'Continuar', linha: l }; }
      if (this.pc('senao')) throw this.erro('Este "senao" não tem um "se" antes.');

      const e = this.expressao();
      // permite escrever sem parênteses: escrever "Olá", nome
      const a = this.atual;
      const iniciaExpr = a.tipo === 'NUM' || a.tipo === 'TXT' || a.tipo === 'ID' ||
        (a.tipo === 'PC' && ['verdadeiro', 'falso', 'nulo', 'nao'].includes(a.valor)) ||
        (a.tipo === 'OP' && ['[', '{', '-'].includes(a.valor));
      if (e.tipo === 'Var' && iniciaExpr && !(a.tipo === 'OP' && a.valor === '-')) {
        const args = [];
        do { args.push(this.expressaoArg()); } while (this.op(',') && this.avancar());
        return { tipo: 'Expr', expr: { tipo: 'Chamada', func: e, args, linha: l }, linha: l };
      }
      if (['=', '+=', '-=', '*=', '/='].some((o) => this.op(o))) {
        const opT = this.avancar();
        if (!['Var', 'Indice', 'Membro'].includes(e.tipo)) {
          throw new ErroPalavra('Do lado esquerdo do "=" tem de estar o nome de uma variável.', l, 'Erro de escrita');
        }
        const valor = this.expressao();
        return { tipo: 'Atribuir', alvo: e, op: opT.valor, valor, linha: l };
      }
      return { tipo: 'Expr', expr: e, linha: l };
    }

    parametros() {
      this.esperarOp('(', 'Depois do nome da função escreve os parâmetros entre parênteses. Exemplo: funcao ola(nome)');
      const params = [];
      if (!this.op(')')) {
        do {
          params.push(this.esperarNome('Esperava o nome de um parâmetro.').valor);
        } while (this.op(',') && this.avancar());
      }
      this.esperarOp(')', 'Falta fechar o parêntese ")" dos parâmetros.');
      return params;
    }

    seResto(l) {
      const cond = this.condicao();
      if (this.ctx('entao')) this.avancar();
      const entao = this.bloco(['senao', 'fim']);
      let senao = null;
      if (this.pc('senao')) {
        this.avancar();
        if (this.pc('se')) {
          const l2 = this.avancar().linha;
          senao = [this.seResto(l2)];
          return { tipo: 'Se', cond, entao, senao, linha: l };
        }
        senao = this.bloco(['fim']);
      }
      this.fecharFim('se', l);
      return { tipo: 'Se', cond, entao, senao, linha: l };
    }

    para() {
      const l = this.avancar().linha;
      if (this.ctx('cada')) {
        this.avancar();
        const nome = this.esperarNome('Depois de "para cada" escreve um nome. Exemplo: para cada fruta em frutas').valor;
        if (!this.ctx('em')) throw this.erro('Esperava a palavra "em". Exemplo: para cada fruta em frutas');
        this.avancar();
        const lista = this.expressao();
        if (this.ctx('faca')) this.avancar();
        const corpo = this.bloco(['fim']);
        this.fecharFim('para', l);
        return { tipo: 'ParaCada', nome, lista, corpo, linha: l };
      }
      const nome = this.esperarNome('Depois de "para" escreve o nome do contador. Exemplo: para i de 1 ate 10').valor;
      if (!this.ctx('de')) throw this.erro('Esperava a palavra "de". Exemplo: para i de 1 ate 10');
      this.avancar();
      const inicio = this.expressao();
      if (!this.ctx('ate')) throw this.erro('Esperava a palavra "até". Exemplo: para i de 1 até 10');
      this.avancar();
      const final = this.expressao();
      let passo = null;
      if (this.ctx('passo')) { this.avancar(); passo = this.expressao(); }
      if (this.ctx('faca')) this.avancar();
      const corpo = this.bloco(['fim']);
      this.fecharFim('para', l);
      return { tipo: 'Para', nome, inicio, final, passo, corpo, linha: l };
    }

    condicao() {
      const antes = this.emCond;
      this.emCond = true;
      const e = this.expressao();
      this.emCond = antes;
      return e;
    }

    expressao() { return this.ou(); }
    ou() {
      let e = this.e_();
      while (this.pc('ou')) { const l = this.avancar().linha; e = { tipo: 'Logico', op: 'ou', a: e, b: this.e_(), linha: l }; }
      return e;
    }
    e_() {
      let e = this.nao();
      while (this.pc('e')) { const l = this.avancar().linha; e = { tipo: 'Logico', op: 'e', a: e, b: this.nao(), linha: l }; }
      return e;
    }
    nao() {
      if (this.pc('nao')) { const l = this.avancar().linha; return { tipo: 'Nao', expr: this.nao(), linha: l }; }
      return this.comparacao();
    }
    comparacao() {
      let e = this.soma();
      while (['==', '!=', '<', '>', '<=', '>='].some((o) => this.op(o)) || (this.emCond && this.op('='))) {
        const t = this.avancar();
        const o = t.valor === '=' ? '==' : t.valor;
        e = { tipo: 'Bin', op: o, a: e, b: this.soma(), linha: t.linha };
      }
      return e;
    }
    soma() {
      let e = this.produto();
      while (this.op('+') || this.op('-')) { const t = this.avancar(); e = { tipo: 'Bin', op: t.valor, a: e, b: this.produto(), linha: t.linha }; }
      return e;
    }
    produto() {
      let e = this.unario();
      while (this.op('*') || this.op('/') || this.op('%') || this.pc('mod')) {
        const t = this.avancar();
        const o = t.valor === 'mod' ? '%' : t.valor;
        e = { tipo: 'Bin', op: o, a: e, b: this.unario(), linha: t.linha };
      }
      return e;
    }
    unario() {
      if (this.op('-')) { const l = this.avancar().linha; return { tipo: 'Neg', expr: this.unario(), linha: l }; }
      if (this.op('+')) { this.avancar(); return this.unario(); }
      return this.potencia();
    }
    potencia() {
      const base = this.posfixo();
      if (this.op('^')) { const t = this.avancar(); return { tipo: 'Bin', op: '^', a: base, b: this.unario(), linha: t.linha }; }
      return base;
    }
    posfixo() {
      let e = this.primario();
      while (true) {
        if (this.op('(')) {
          const l = this.avancar().linha;
          const args = [];
          if (!this.op(')')) {
            do { args.push(this.expressaoArg()); } while (this.op(',') && this.avancar());
          }
          this.esperarOp(')', 'Falta fechar o parêntese ")" da chamada.');
          e = { tipo: 'Chamada', func: e, args, linha: l };
        } else if (this.op('[')) {
          const l = this.avancar().linha;
          const indice = this.expressaoArg();
          this.esperarOp(']', 'Falta fechar o parêntese reto "]".');
          e = { tipo: 'Indice', alvo: e, indice, linha: l };
        } else if (this.op('.')) {
          const l = this.avancar().linha;
          const t = this.atual;
          if (t.tipo !== 'ID' && t.tipo !== 'PC') throw this.erro('Depois do "." escreve o nome de uma chave.');
          this.avancar();
          e = { tipo: 'Membro', alvo: e, nome: t.bruto || t.valor, linha: l };
        } else break;
      }
      return e;
    }
    expressaoArg() {
      const antes = this.emCond;
      this.emCond = false;
      const e = this.expressao();
      this.emCond = antes;
      return e;
    }
    primario() {
      const t = this.atual, l = t.linha;
      if (t.tipo === 'NUM' || t.tipo === 'TXT') { this.avancar(); return { tipo: 'Literal', valor: t.valor, linha: l }; }
      if (this.pc('verdadeiro')) { this.avancar(); return { tipo: 'Literal', valor: true, linha: l }; }
      if (this.pc('falso')) { this.avancar(); return { tipo: 'Literal', valor: false, linha: l }; }
      if (this.pc('nulo')) { this.avancar(); return { tipo: 'Literal', valor: null, linha: l }; }
      if (t.tipo === 'ID') { this.avancar(); return { tipo: 'Var', nome: t.valor, bruto: t.bruto, linha: l }; }
      if (this.op('(')) {
        this.avancar();
        const e = this.expressaoArg();
        this.esperarOp(')', 'Falta fechar o parêntese ")".');
        return e;
      }
      if (this.op('[')) {
        this.avancar();
        const itens = [];
        if (!this.op(']')) {
          do {
            if (this.op(']')) break;
            itens.push(this.expressaoArg());
          } while (this.op(',') && this.avancar());
        }
        this.esperarOp(']', 'Falta fechar a lista com "]". Separa os elementos com vírgulas.');
        return { tipo: 'Lista', itens, linha: l };
      }
      if (this.op('{')) {
        this.avancar();
        const pares = [];
        if (!this.op('}')) {
          do {
            if (this.op('}')) break;
            const kt = this.atual;
            let chave;
            if (kt.tipo === 'ID' || kt.tipo === 'PC') chave = kt.bruto || kt.valor;
            else if (kt.tipo === 'TXT' || kt.tipo === 'NUM') chave = String(kt.valor);
            else throw this.erro('Esperava o nome de uma chave do dicionário.');
            this.avancar();
            this.esperarOp(':', 'Depois da chave escreve ":" e o valor. Exemplo: { nome: "Ana" }');
            pares.push([chave, this.expressaoArg()]);
          } while (this.op(',') && this.avancar());
        }
        this.esperarOp('}', 'Falta fechar o dicionário com "}".');
        return { tipo: 'Dicionario', pares, linha: l };
      }
      if (t.tipo === 'NL' || t.tipo === 'FIM_FICHEIRO') throw this.erro('A linha acabou antes do tempo: falta qualquer coisa aqui.');
      if (t.tipo === 'PC') throw this.erro(`Não esperava a palavra "${t.bruto}" aqui.`);
      throw this.erro(`Não esperava ${descrever(t)} aqui.`);
    }
  }

  // ---------------------------------------------------------------- Valores
  function tipoDe(v) {
    if (v === null || v === undefined) return 'nulo';
    if (typeof v === 'number') return 'número';
    if (typeof v === 'string') return 'texto';
    if (typeof v === 'boolean') return 'lógico';
    if (Array.isArray(v)) return 'lista';
    if (v instanceof Map) return 'dicionário';
    if (v && v.__funcao) return 'função';
    return 'desconhecido';
  }

  function formatarNumero(n) {
    if (!isFinite(n)) return n > 0 ? 'infinito' : n < 0 ? '-infinito' : 'não é número';
    if (Number.isInteger(n)) return String(n);
    return String(parseFloat(n.toFixed(10)));
  }

  function formatar(v, dentro = false, vistos = new Set()) {
    if (v === null || v === undefined) return 'nulo';
    if (typeof v === 'boolean') return v ? 'verdadeiro' : 'falso';
    if (typeof v === 'number') return formatarNumero(v);
    if (typeof v === 'string') return dentro ? JSON.stringify(v) : v;
    if (Array.isArray(v)) {
      if (vistos.has(v)) return '[...]';
      vistos.add(v);
      const s = '[' + v.map((x) => formatar(x, true, vistos)).join(', ') + ']';
      vistos.delete(v);
      return s;
    }
    if (v instanceof Map) {
      if (vistos.has(v)) return '{...}';
      vistos.add(v);
      const s = '{' + [...v].map(([k, x]) => `${k}: ${formatar(x, true, vistos)}`).join(', ') + '}';
      vistos.delete(v);
      return s;
    }
    if (v.__funcao) return `<função ${v.nome}>`;
    return String(v);
  }

  function verdade(v) {
    return !(v === false || v === null || v === undefined || v === 0 || v === '');
  }

  function iguais(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => iguais(x, b[i]));
    if (a instanceof Map && b instanceof Map) return a.size === b.size && [...a].every(([k, x]) => b.has(k) && iguais(x, b.get(k)));
    if (a === undefined) a = null;
    if (b === undefined) b = null;
    return a === b;
  }

  function distancia(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[m][n];
  }

  // ---------------------------------------------------------------- Ambiente
  class Ambiente {
    constructor(pai = null) { this.vars = new Map(); this.pai = pai; }
    procurar(n) { let a = this; while (a) { if (a.vars.has(n)) return a; a = a.pai; } return null; }
    definir(n, v) { this.vars.set(n, v); }
    atribuir(n, v) { (this.procurar(n) || this).vars.set(n, v); }
    nomes() { const s = new Set(); let a = this; while (a) { for (const k of a.vars.keys()) s.add(k); a = a.pai; } return [...s]; }
  }

  class SinalRetorno { constructor(v) { this.valor = v; } }
  class SinalInterromper { constructor(l) { this.linha = l; } }
  class SinalContinuar { constructor(l) { this.linha = l; } }

  const pausa = () => new Promise((r) => setTimeout(r, 0));

  // ---------------------------------------------------------------- Interpretador
  class Interpretador {
    constructor(es = {}) {
      this.es = {
        escrever: es.escrever || ((t) => console.log(t)),
        ler: es.ler || (async () => ''),
        limpar: es.limpar || (() => {}),
      };
      this.parado = false;
      this.passos = 0;
      this.profundidade = 0;
      this.nativas = new Ambiente();
      this.instalarNativas();
      this.global = new Ambiente(this.nativas);
    }

    parar() { this.parado = true; }

    nativa(nome, fn, ajuda) {
      this.nativas.definir(nome, { __funcao: true, nativa: true, nome, fn, ajuda });
    }

    instalarNativas() {
      const self = this;
      const exigir = (cond, msg, l) => { if (!cond) throw new ErroPalavra(msg, l); };
      const num = (v, nomeF, l) => {
        exigir(typeof v === 'number', `A função ${nomeF}() precisa de um número, mas recebeu ${tipoDe(v)} (${formatar(v, true)}).`, l);
        return v;
      };
      const lista = (v, nomeF, l) => {
        exigir(Array.isArray(v), `A função ${nomeF}() precisa de uma lista, mas recebeu ${tipoDe(v)}.`, l);
        return v;
      };
      const txt = (v, nomeF, l) => {
        exigir(typeof v === 'string', `A função ${nomeF}() precisa de um texto, mas recebeu ${tipoDe(v)}.`, l);
        return v;
      };
      const paraNumero = (v) => {
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 1 : 0;
        if (typeof v !== 'string') return null;
        const s = v.trim().replace(/\s/g, '').replace(',', '.');
        if (s === '' || !/^[-+]?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
        return parseFloat(s);
      };
      this.paraNumero = paraNumero;

      const escrever = (args) => { self.es.escrever(args.map((a) => formatar(a)).join(' ')); return null; };
      this.nativa('escrever', escrever);
      this.nativa('mostrar', escrever);
      this.nativa('imprimir', escrever);

      const ler = async (args) => {
        const pergunta = args.length ? args.map((a) => formatar(a)).join(' ') : '';
        const r = await self.es.ler(pergunta);
        if (self.parado) throw new ErroPalavra('Programa parado.', 0, 'Parado');
        const n = paraNumero(r);
        return n === null ? r : n;
      };
      this.nativa('ler', ler);
      this.nativa('perguntar', ler);
      this.nativa('lerTexto', async (args) => {
        const r = await self.es.ler(args.map((a) => formatar(a)).join(' '));
        if (self.parado) throw new ErroPalavra('Programa parado.', 0, 'Parado');
        return r;
      });
      this.nativa('lerNumero', async (args, l) => {
        const pergunta = args.map((a) => formatar(a)).join(' ');
        while (true) {
          const r = await self.es.ler(pergunta);
          if (self.parado) throw new ErroPalavra('Programa parado.', 0, 'Parado');
          const n = paraNumero(r);
          if (n !== null) return n;
          self.es.escrever('⚠ Isso não é um número. Tenta outra vez.');
        }
      });
      this.nativa('limpar', () => { self.es.limpar(); return null; });
      this.nativa('esperar', async ([s], l) => {
        num(s, 'esperar', l);
        const fim = Date.now() + s * 1000;
        while (Date.now() < fim) {
          if (self.parado) throw new ErroPalavra('Programa parado.', l, 'Parado');
          await new Promise((r) => setTimeout(r, Math.min(50, fim - Date.now())));
        }
        return null;
      });

      this.nativa('tamanho', ([v], l) => {
        if (typeof v === 'string' || Array.isArray(v)) return v.length;
        if (v instanceof Map) return v.size;
        throw new ErroPalavra(`tamanho() funciona com textos, listas e dicionários, não com ${tipoDe(v)}.`, l);
      });
      this.nativa('adicionar', ([lst, v], l) => { lista(lst, 'adicionar', l).push(v); return lst; });
      this.nativa('inserir', ([lst, pos, v], l) => {
        lista(lst, 'inserir', l); num(pos, 'inserir', l);
        exigir(pos >= 1 && pos <= lst.length + 1, `Posição ${pos} inválida para inserir numa lista com ${lst.length} elementos.`, l);
        lst.splice(pos - 1, 0, v); return lst;
      });
      this.nativa('remover', ([lst, pos], l) => {
        if (lst instanceof Map) { const v = lst.get(String(pos)); lst.delete(String(pos)); return v ?? null; }
        lista(lst, 'remover', l);
        if (pos === undefined) pos = lst.length;
        num(pos, 'remover', l);
        exigir(pos >= 1 && pos <= lst.length, `A lista tem ${lst.length} elementos, não há posição ${formatarNumero(pos)} para remover.`, l);
        return lst.splice(pos - 1, 1)[0];
      });
      this.nativa('contem', ([a, v], l) => {
        if (typeof a === 'string') return a.includes(formatar(v));
        if (Array.isArray(a)) return a.some((x) => iguais(x, v));
        if (a instanceof Map) return a.has(String(v));
        throw new ErroPalavra('contem() funciona com textos, listas e dicionários.', l);
      });
      this.nativa('posicao', ([a, v], l) => {
        if (typeof a === 'string') return a.indexOf(formatar(v)) + 1;
        if (Array.isArray(a)) return a.findIndex((x) => iguais(x, v)) + 1;
        throw new ErroPalavra('posicao() funciona com textos e listas.', l);
      });
      this.nativa('juntar', ([lst, sep = ''], l) => lista(lst, 'juntar', l).map((x) => formatar(x)).join(formatar(sep)));
      this.nativa('dividir', ([t, sep = ' '], l) => {
        txt(t, 'dividir', l);
        return sep === ' ' ? t.trim().split(/\s+/).filter(Boolean) : t.split(formatar(sep));
      });
      this.nativa('maiusculas', ([t], l) => txt(t, 'maiusculas', l).toLocaleUpperCase('pt'));
      this.nativa('minusculas', ([t], l) => txt(t, 'minusculas', l).toLocaleLowerCase('pt'));
      this.nativa('aparar', ([t], l) => txt(t, 'aparar', l).trim());
      this.nativa('substituir', ([t, a, b], l) => txt(t, 'substituir', l).split(formatar(a)).join(formatar(b)));
      this.nativa('parte', ([t, ini, fim], l) => {
        exigir(typeof t === 'string' || Array.isArray(t), 'parte() funciona com textos e listas.', l);
        num(ini, 'parte', l);
        if (fim === undefined) fim = t.length;
        num(fim, 'parte', l);
        return t.slice(Math.max(0, ini - 1), fim);
      });
      this.nativa('numero', ([v], l) => {
        const n = paraNumero(v);
        if (n === null) throw new ErroPalavra(`Não consigo transformar ${formatar(v, true)} num número.`, l);
        return n;
      });
      this.nativa('ehNumero', ([v]) => paraNumero(v) !== null && typeof v !== 'boolean');
      this.nativa('texto', ([v]) => formatar(v));
      this.nativa('inteiro', ([v], l) => {
        const n = typeof v === 'number' ? v : paraNumero(v);
        exigir(n !== null, `Não consigo transformar ${formatar(v, true)} num número inteiro.`, l);
        return Math.trunc(n);
      });
      this.nativa('arredondar', ([v, casas = 0], l) => {
        num(v, 'arredondar', l);
        const f = Math.pow(10, casas);
        return Math.round(v * f + Number.EPSILON * Math.sign(v)) / f;
      });
      this.nativa('formatar', ([v, casas = 2], l) => num(v, 'formatar', l).toFixed(casas));
      this.nativa('raiz', ([v], l) => {
        num(v, 'raiz', l);
        exigir(v >= 0, 'Não existe raiz quadrada de um número negativo.', l);
        return Math.sqrt(v);
      });
      this.nativa('potencia', ([a, b], l) => Math.pow(num(a, 'potencia', l), num(b, 'potencia', l)));
      this.nativa('absoluto', ([v], l) => Math.abs(num(v, 'absoluto', l)));
      this.nativa('aleatorio', ([a, b], l) => {
        if (a === undefined) return Math.random();
        if (Array.isArray(a)) { exigir(a.length > 0, 'A lista está vazia.', l); return a[Math.floor(Math.random() * a.length)]; }
        if (b === undefined) { b = a; a = 1; }
        num(a, 'aleatorio', l); num(b, 'aleatorio', l);
        return Math.floor(Math.random() * (Math.floor(b) - Math.ceil(a) + 1)) + Math.ceil(a);
      });
      const valoresDe = (args, nomeF, l) => {
        const vs = args.length === 1 && Array.isArray(args[0]) ? args[0] : args;
        exigir(vs.length > 0, `${nomeF}() precisa de pelo menos um valor.`, l);
        vs.forEach((x) => num(x, nomeF, l));
        return vs;
      };
      this.nativa('maximo', (args, l) => Math.max(...valoresDe(args, 'maximo', l)));
      this.nativa('minimo', (args, l) => Math.min(...valoresDe(args, 'minimo', l)));
      this.nativa('soma', ([lst], l) => { lista(lst, 'soma', l); lst.forEach((x) => num(x, 'soma', l)); return lst.reduce((a, b) => a + b, 0); });
      this.nativa('media', ([lst], l) => {
        lista(lst, 'media', l); exigir(lst.length > 0, 'Não dá para calcular a média de uma lista vazia.', l);
        lst.forEach((x) => num(x, 'media', l)); return lst.reduce((a, b) => a + b, 0) / lst.length;
      });
      this.nativa('ordenar', ([lst], l) => {
        lista(lst, 'ordenar', l);
        return [...lst].sort((a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : formatar(a).localeCompare(formatar(b), 'pt')));
      });
      this.nativa('inverter', ([v], l) => {
        if (typeof v === 'string') return [...v].reverse().join('');
        return [...lista(v, 'inverter', l)].reverse();
      });
      this.nativa('chaves', ([d], l) => { exigir(d instanceof Map, 'chaves() precisa de um dicionário.', l); return [...d.keys()]; });
      this.nativa('valores', ([d], l) => { exigir(d instanceof Map, 'valores() precisa de um dicionário.', l); return [...d.values()]; });
      this.nativa('tipo', ([v]) => tipoDe(v));
      this.nativa('sequencia', ([a, b], l) => {
        if (b === undefined) { b = a; a = 1; }
        num(a, 'sequencia', l); num(b, 'sequencia', l);
        exigir(Math.abs(b - a) <= 1e6, 'Sequência demasiado grande.', l);
        const r = []; const p = a <= b ? 1 : -1;
        for (let i = a; p > 0 ? i <= b : i >= b; i += p) r.push(i);
        return r;
      });
      const dois = (n) => String(n).padStart(2, '0');
      this.nativa('hora', () => { const d = new Date(); return `${dois(d.getHours())}:${dois(d.getMinutes())}`; });
      this.nativa('data', () => { const d = new Date(); return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()}`; });
      this.nativa('ano', () => new Date().getFullYear());
      this.nativas.definir('PI', Math.PI);
    }

    async executar(codigo) {
      const toks = analisarLexico(codigo);
      const arvore = new Analisador(toks).programa();
      this.parado = false;
      try {
        await this.blocoExec(arvore, this.global);
      } catch (e) {
        if (e instanceof SinalRetorno) return;
        if (e instanceof SinalInterromper) throw new ErroPalavra('"interromper" só pode ser usado dentro de um ciclo (enquanto, para, repetir).', e.linha);
        if (e instanceof SinalContinuar) throw new ErroPalavra('"continuar" só pode ser usado dentro de um ciclo (enquanto, para, repetir).', e.linha);
        throw e;
      }
    }

    async passo(l) {
      if (this.parado) throw new ErroPalavra('Programa parado.', l, 'Parado');
      if (++this.passos % 200 === 0 && Date.now() - (this.ultimaPausa || 0) > 25) {
        await pausa();
        this.ultimaPausa = Date.now();
        if (this.parado) throw new ErroPalavra('Programa parado.', l, 'Parado');
      }
    }

    async blocoExec(lista, amb) {
      for (const inst of lista) await this.exec(inst, amb);
    }

    async ciclo(corpo, amb, l) {
      // devolve false se deve interromper
      await this.passo(l);
      try {
        await this.blocoExec(corpo, amb);
      } catch (e) {
        if (e instanceof SinalInterromper) return false;
        if (e instanceof SinalContinuar) return true;
        throw e;
      }
      return true;
    }

    async exec(n, amb) {
      switch (n.tipo) {
        case 'Expr': await this.aval(n.expr, amb); return;
        case 'Declarar': amb.definir(n.nome, await this.aval(n.valor, amb)); return;
        case 'Atribuir': await this.atribuir(n, amb); return;
        case 'Se': {
          if (verdade(await this.aval(n.cond, amb))) await this.blocoExec(n.entao, amb);
          else if (n.senao) await this.blocoExec(n.senao, amb);
          return;
        }
        case 'Enquanto': {
          while (verdade(await this.aval(n.cond, amb))) {
            if (!(await this.ciclo(n.corpo, amb, n.linha))) break;
          }
          return;
        }
        case 'Repetir': {
          const v = await this.aval(n.vezes, amb);
          if (typeof v !== 'number') throw new ErroPalavra(`"repetir" precisa de um número de vezes, mas recebeu ${tipoDe(v)}.`, n.linha);
          for (let i = 0; i < v; i++) if (!(await this.ciclo(n.corpo, amb, n.linha))) break;
          return;
        }
        case 'Para': {
          const ini = await this.aval(n.inicio, amb);
          const fim = await this.aval(n.final, amb);
          if (typeof ini !== 'number' || typeof fim !== 'number') throw new ErroPalavra('Em "para ... de ... até ...", o início e o fim têm de ser números.', n.linha);
          let p = n.passo ? await this.aval(n.passo, amb) : ini <= fim ? 1 : -1;
          if (typeof p !== 'number' || p === 0) throw new ErroPalavra('O "passo" tem de ser um número diferente de zero.', n.linha);
          for (let i = ini; p > 0 ? i <= fim + 1e-9 : i >= fim - 1e-9; i += p) {
            amb.atribuir(n.nome, parseFloat(i.toFixed(10)));
            if (!(await this.ciclo(n.corpo, amb, n.linha))) break;
          }
          return;
        }
        case 'ParaCada': {
          const col = await this.aval(n.lista, amb);
          let itens;
          if (Array.isArray(col)) itens = [...col];
          else if (typeof col === 'string') itens = [...col];
          else if (col instanceof Map) itens = [...col.keys()];
          else if (typeof col === 'number') itens = Array.from({ length: Math.max(0, Math.floor(col)) }, (_, i) => i + 1);
          else throw new ErroPalavra(`"para cada" precisa de uma lista, texto ou dicionário, mas recebeu ${tipoDe(col)}.`, n.linha);
          for (const it of itens) {
            amb.atribuir(n.nome, it);
            if (!(await this.ciclo(n.corpo, amb, n.linha))) break;
          }
          return;
        }
        case 'DeclFuncao':
          amb.definir(n.nome, { __funcao: true, nome: n.nome, params: n.params, corpo: n.corpo, fecho: amb });
          return;
        case 'Retornar':
          throw new SinalRetorno(n.valor ? await this.aval(n.valor, amb) : null);
        case 'Interromper': throw new SinalInterromper(n.linha);
        case 'Continuar': throw new SinalContinuar(n.linha);
      }
      throw new ErroPalavra('Instrução desconhecida.', n.linha);
    }

    async atribuir(n, amb) {
      let v = await this.aval(n.valor, amb);
      const alvo = n.alvo;
      if (n.op !== '=') {
        const atual = await this.aval(alvo, amb);
        v = this.binario(n.op[0], atual, v, n.linha);
      }
      if (alvo.tipo === 'Var') {
        const existente = amb.procurar(alvo.nome);
        // um nome igual a uma função pronta passa a ser uma variável tua
        if (existente === this.nativas) amb.definir(alvo.nome, v);
        else amb.atribuir(alvo.nome, v);
        return;
      }
      const obj = await this.aval(alvo.alvo, amb);
      if (alvo.tipo === 'Membro') {
        if (!(obj instanceof Map)) throw new ErroPalavra(`Só os dicionários têm chaves com ".", mas isto é ${tipoDe(obj)}.`, n.linha);
        obj.set(alvo.nome, v);
        return;
      }
      const idx = await this.aval(alvo.indice, amb);
      if (Array.isArray(obj)) {
        if (typeof idx !== 'number' || !Number.isInteger(idx)) throw new ErroPalavra('A posição numa lista tem de ser um número inteiro.', n.linha);
        if (idx < 1 || idx > obj.length + 1) throw new ErroPalavra(`A lista tem ${obj.length} elementos. Não podes guardar na posição ${idx}. Lembra-te: a primeira posição é 1.`, n.linha);
        obj[idx - 1] = v;
        return;
      }
      if (obj instanceof Map) { obj.set(formatar(idx), v); return; }
      throw new ErroPalavra(`Não consigo guardar valores dentro de ${tipoDe(obj)}.`, n.linha);
    }

    obterVar(n, amb) {
      const a = amb.procurar(n.nome);
      if (a) return a.vars.get(n.nome);
      // tolera maiúsculas nas funções prontas (Escrever, ESCREVER...)
      const min = n.nome.toLowerCase();
      for (const [k, v] of this.nativas.vars) if (k.toLowerCase() === min && v && v.nativa) return v;
      const nomes = amb.nomes();
      let melhor = null, dist = min.length < 3 ? 0 : Math.min(3, Math.ceil(min.length / 3) + 1);
      for (const k of nomes) {
        const d = distancia(min, k.toLowerCase());
        if (d < dist) { dist = d; melhor = k; }
      }
      let msg = `Não conheço "${n.bruto}". Ainda não foi criado nenhum valor ou função com esse nome.`;
      if (melhor) msg += ` Querias dizer "${melhor}"?`;
      else if (n.bruto.length > 1) msg += ` Se é um texto, coloca-o entre aspas: "${n.bruto}".`;
      throw new ErroPalavra(msg, n.linha);
    }

    binario(op, a, b, l) {
      const nomeOp = { '+': 'somar', '-': 'subtrair', '*': 'multiplicar', '/': 'dividir', '%': 'calcular o resto de', '^': 'elevar' }[op];
      if (op === '+') {
        if (typeof a === 'number' && typeof b === 'number') return a + b;
        if (typeof a === 'string' || typeof b === 'string') return formatar(a) + formatar(b);
        if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
        throw new ErroPalavra(`Não consigo somar ${tipoDe(a)} com ${tipoDe(b)}.`, l);
      }
      if (op === '*' && typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, b));
      if (typeof a !== 'number' || typeof b !== 'number') {
        throw new ErroPalavra(`Não consigo ${nomeOp} ${tipoDe(a)} (${formatar(a, true)}) com ${tipoDe(b)} (${formatar(b, true)}). Estas contas só funcionam com números.`, l);
      }
      switch (op) {
        case '-': return a - b;
        case '*': return a * b;
        case '/': if (b === 0) throw new ErroPalavra('Não é possível dividir por zero.', l); return a / b;
        case '%': if (b === 0) throw new ErroPalavra('Não é possível calcular o resto da divisão por zero.', l); return ((a % b) + b) % b;
        case '^': return Math.pow(a, b);
      }
    }

    async aval(n, amb) {
      switch (n.tipo) {
        case 'Literal': return n.valor;
        case 'Var': return this.obterVar(n, amb);
        case 'Lista': { const r = []; for (const i of n.itens) r.push(await this.aval(i, amb)); return r; }
        case 'Dicionario': { const m = new Map(); for (const [k, v] of n.pares) m.set(k, await this.aval(v, amb)); return m; }
        case 'Neg': {
          const v = await this.aval(n.expr, amb);
          if (typeof v !== 'number') throw new ErroPalavra(`O sinal "-" só funciona com números, não com ${tipoDe(v)}.`, n.linha);
          return -v;
        }
        case 'Nao': return !verdade(await this.aval(n.expr, amb));
        case 'Logico': {
          const a = await this.aval(n.a, amb);
          if (n.op === 'e') return verdade(a) ? verdade(await this.aval(n.b, amb)) : false;
          return verdade(a) ? true : verdade(await this.aval(n.b, amb));
        }
        case 'Bin': {
          const a = await this.aval(n.a, amb);
          const b = await this.aval(n.b, amb);
          switch (n.op) {
            case '==': return iguais(a, b);
            case '!=': return !iguais(a, b);
            case '<': case '>': case '<=': case '>=': {
              const ok = (typeof a === 'number' && typeof b === 'number') || (typeof a === 'string' && typeof b === 'string');
              if (!ok) throw new ErroPalavra(`Não consigo comparar ${tipoDe(a)} (${formatar(a, true)}) com ${tipoDe(b)} (${formatar(b, true)}).`, n.linha);
              if (typeof a === 'string') {
                const c = a.localeCompare(b, 'pt');
                return n.op === '<' ? c < 0 : n.op === '>' ? c > 0 : n.op === '<=' ? c <= 0 : c >= 0;
              }
              return n.op === '<' ? a < b : n.op === '>' ? a > b : n.op === '<=' ? a <= b : a >= b;
            }
            default: return this.binario(n.op, a, b, n.linha);
          }
        }
        case 'Indice': {
          const obj = await this.aval(n.alvo, amb);
          const idx = await this.aval(n.indice, amb);
          if (Array.isArray(obj) || typeof obj === 'string') {
            if (typeof idx !== 'number' || !Number.isInteger(idx)) throw new ErroPalavra('A posição tem de ser um número inteiro.', n.linha);
            const nome = Array.isArray(obj) ? 'A lista' : 'O texto';
            const unid = Array.isArray(obj) ? 'elementos' : 'letras';
            if (idx < 1 || idx > obj.length) {
              throw new ErroPalavra(`${nome} tem ${obj.length} ${unid}, por isso a posição ${idx} não existe.${idx === 0 ? ' Lembra-te: a primeira posição é 1.' : ''}`, n.linha);
            }
            return obj[idx - 1];
          }
          if (obj instanceof Map) {
            const k = formatar(idx);
            if (!obj.has(k)) throw new ErroPalavra(`O dicionário não tem a chave "${k}".`, n.linha);
            return obj.get(k);
          }
          throw new ErroPalavra(`Não dá para usar [ ] com ${tipoDe(obj)}.`, n.linha);
        }
        case 'Membro': {
          const obj = await this.aval(n.alvo, amb);
          if (!(obj instanceof Map)) throw new ErroPalavra(`Só os dicionários têm chaves com ".", mas isto é ${tipoDe(obj)}.`, n.linha);
          if (!obj.has(n.nome)) throw new ErroPalavra(`O dicionário não tem a chave "${n.nome}".`, n.linha);
          return obj.get(n.nome);
        }
        case 'Chamada': {
          const f = await this.aval(n.func, amb);
          const args = [];
          for (const a of n.args) args.push(await this.aval(a, amb));
          return this.chamar(f, args, n);
        }
      }
      throw new ErroPalavra('Expressão desconhecida.', n.linha);
    }

    async chamar(f, args, n) {
      if (!f || !f.__funcao) {
        const nome = n.func.tipo === 'Var' ? `"${n.func.bruto}"` : 'Isto';
        throw new ErroPalavra(`${nome} não é uma função, é ${tipoDe(f)}. Não pode ser chamado com ( ).`, n.linha);
      }
      await this.passo(n.linha);
      if (f.nativa) return (await f.fn(args, n.linha)) ?? null;
      if (args.length !== f.params.length) {
        throw new ErroPalavra(`A função "${f.nome}" precisa de ${f.params.length} valor(es) (${f.params.join(', ') || 'nenhum'}), mas recebeu ${args.length}.`, n.linha);
      }
      if (this.profundidade > 400) throw new ErroPalavra(`Demasiadas chamadas dentro de chamadas na função "${f.nome}". Será que a função se chama a si própria sem parar?`, n.linha);
      const local = new Ambiente(f.fecho);
      f.params.forEach((p, i) => local.definir(p, args[i]));
      this.profundidade++;
      try {
        await this.blocoExec(f.corpo, local);
      } catch (e) {
        if (e instanceof SinalRetorno) return e.valor;
        if (e instanceof SinalInterromper || e instanceof SinalContinuar) {
          throw new ErroPalavra(`"${e instanceof SinalInterromper ? 'interromper' : 'continuar'}" só pode ser usado dentro de um ciclo.`, e.linha);
        }
        throw e;
      } finally {
        this.profundidade--;
      }
      return null;
    }
  }

  const API = { ALIAS, PARA_EN, Interpretador, ErroPalavra, analisarLexico, Analisador, formatar, RESERVADAS, CONTEXTO, semAcentos };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else global.Palavra = API;
})(typeof window !== 'undefined' ? window : globalThis);
