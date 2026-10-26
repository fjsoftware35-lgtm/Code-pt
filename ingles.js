/* Modo inglês: converte o programa do aluno para palavras em inglês (o Palavra entende as duas línguas) */
(function () {
  'use strict';
  const P = window.Palavra;
  const sem = (w) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function paraIngles(codigo) {
    let out = '', i = 0;
    const n = codigo.length;
    while (i < n) {
      const c = codigo[i];
      if (c === '#') { let j = codigo.indexOf('\n', i); if (j < 0) j = n; out += codigo.slice(i, j); i = j; continue; }
      if (c === '"' || c === "'") {
        let j = i + 1;
        while (j < n && codigo[j] !== c && codigo[j] !== '\n') { if (codigo[j] === '\\') j++; j++; }
        out += codigo.slice(i, j + 1); i = j + 1; continue;
      }
      if (/[\p{L}_]/u.test(c)) {
        let j = i;
        while (j < n && /[\p{L}\p{N}_]/u.test(codigo[j])) j++;
        const w = codigo.slice(i, j), k = sem(w);
        out += Object.prototype.hasOwnProperty.call(P.PARA_EN, k) ? P.PARA_EN[k] : w;
        i = j; continue;
      }
      out += c; i++;
    }
    return out;
  }
  P.paraIngles = paraIngles;
  if (typeof document === 'undefined') return;

  const alvo = document.querySelector('#ingles');
  if (!alvo) return;
  const caixa = document.createElement('div');
  caixa.className = 'ing-caixa';
  caixa.innerHTML = '<strong>Já podes escrever em inglês! 🎉</strong><p>O Palavra entende as duas línguas ao mesmo tempo: <code>print</code>, <code>input</code>, <code>if</code>, <code>else</code>, <code>end</code>, <code>for … to … do</code>, <code>while</code>, <code>repeat … times</code>. Podes misturar português e inglês no mesmo programa.</p><div class="ing-botoes"><button class="btn btn-correr ing-conv" type="button">Converter o meu programa para inglês</button><button class="btn ing-desf" type="button" hidden>Desfazer</button></div><p class="ing-msg" role="status"></p>';
  alvo.insertBefore(caixa, alvo.firstChild);
  const f = () => document.querySelector('#fonte');
  const msg = caixa.querySelector('.ing-msg'), desf = caixa.querySelector('.ing-desf');
  let antes = null;
  const por = (t) => { f().value = t; f().dispatchEvent(new Event('input')); };
  caixa.querySelector('.ing-conv').addEventListener('click', () => {
    antes = f().value;
    por(paraIngles(antes));
    desf.hidden = false;
    msg.textContent = 'Feito! O programa no editor está em inglês e funciona na mesma. Carrega em Executar para ver.';
  });
  desf.addEventListener('click', () => { if (antes !== null) por(antes); desf.hidden = true; msg.textContent = 'Voltou ao português.'; });
})();
