/* Lições e exemplos da linguagem Palavra */
window.LICOES = [
  {
    grupo: 'Primeiros passos',
    itens: [
      {
        titulo: 'Olá, mundo',
        resumo: 'Mostrar uma mensagem no ecrã com escrever.',
        codigo: `# As linhas que começam com # são comentários.
# O computador ignora-as: servem para explicar o código.

escrever("Olá, mundo!")
escrever("Estou a programar em português.")
escrever("2 + 3 =", 2 + 3)`,
      },
      {
        titulo: 'Variáveis',
        resumo: 'Guardar valores com um nome para usar depois.',
        codigo: `# Uma variável é uma caixa com um nome, onde guardas um valor.
nome = "Amina"
idade = 17
altura = 1.65

escrever("Nome:", nome)
escrever("Idade:", idade)

# Podes mudar o valor de uma variável
idade = idade + 1
escrever("No próximo ano terá", idade, "anos.")

# Juntar textos com +
mensagem = "Olá, " + nome + "!"
escrever(mensagem)`,
      },
      {
        titulo: 'Perguntar ao utilizador',
        resumo: 'Usar ler() para receber respostas.',
        codigo: `# ler() faz uma pergunta e espera pela resposta.
# Escreve a resposta na consola e carrega Enter.

nome = ler("Como te chamas?")
escrever("Muito prazer,", nome + "!")

nascimento = ler("Em que ano nasceste?")
idade = ano() - nascimento
escrever("Este ano fazes", idade, "anos.")`,
      },
      {
        titulo: 'Contas',
        resumo: 'Somar, subtrair, multiplicar, dividir e mais.',
        codigo: `a = 17
b = 5

escrever("Soma:", a + b)
escrever("Subtração:", a - b)
escrever("Multiplicação:", a * b)
escrever("Divisão:", a / b)
escrever("Resto da divisão:", a % b)
escrever("Potência:", 2 ^ 10)
escrever("Raiz de 81:", raiz(81))
escrever("Arredondar 3.14159:", arredondar(3.14159, 2))`,
      },
    ],
  },
  {
    grupo: 'Decisões',
    itens: [
      {
        titulo: 'Se, senão',
        resumo: 'Fazer coisas diferentes conforme uma condição.',
        codigo: `nota = ler("Qual foi a tua nota (0 a 20)?")

se nota >= 18 então
  escrever("Excelente!")
senão se nota >= 10 então
  escrever("Passaste. Parabéns!")
senão
  escrever("Não passaste. Continua a estudar!")
fim`,
      },
      {
        titulo: 'E, ou, não',
        resumo: 'Combinar várias condições.',
        codigo: `idade = 20
tem_bilhete = verdadeiro

se idade >= 18 e tem_bilhete então
  escrever("Podes entrar.")
fim

dia = "sábado"
se dia == "sábado" ou dia == "domingo" então
  escrever("É fim de semana!")
fim

chove = falso
se não chove então
  escrever("Vamos à praia.")
fim`,
      },
      {
        titulo: 'Par ou ímpar',
        resumo: 'Usar o resto da divisão para decidir.',
        codigo: `numero = ler("Escreve um número inteiro:")

se numero % 2 == 0 então
  escrever(numero, "é par.")
senão
  escrever(numero, "é ímpar.")
fim`,
      },
    ],
  },
  {
    grupo: 'Repetições',
    itens: [
      {
        titulo: 'Repetir',
        resumo: 'A forma mais simples de repetir.',
        codigo: `repetir 3 vezes
  escrever("Hip, hip, hurra!")
fim`,
      },
      {
        titulo: 'Tabuada',
        resumo: 'Contar com para ... de ... até.',
        codigo: `n = ler("Que tabuada queres ver?")

para i de 1 até 10 faça
  escrever(n, "x", i, "=", n * i)
fim`,
      },
      {
        titulo: 'Enquanto',
        resumo: 'Repetir enquanto uma condição for verdadeira.',
        codigo: `contagem = 5

enquanto contagem > 0 faça
  escrever(contagem, "...")
  esperar(0.5)
  contagem = contagem - 1
fim

escrever("Descolar!")`,
      },
      {
        titulo: 'Adivinha o número',
        resumo: 'Um pequeno jogo com aleatorio() e enquanto.',
        codigo: `secreto = aleatorio(1, 50)
tentativas = 0
escrever("Pensei num número de 1 a 50. Adivinha!")

enquanto verdadeiro faça
  palpite = lerNumero("O teu palpite:")
  tentativas = tentativas + 1

  se palpite == secreto então
    escrever("Acertaste em", tentativas, "tentativas!")
    interromper
  senão se palpite < secreto então
    escrever("É maior.")
  senão
    escrever("É menor.")
  fim
fim`,
      },
    ],
  },
  {
    grupo: 'Listas e dicionários',
    itens: [
      {
        titulo: 'Listas',
        resumo: 'Guardar vários valores numa só variável.',
        codigo: `frutas = ["manga", "caju", "banana"]

escrever("A primeira fruta é", frutas[1])
escrever("Tenho", tamanho(frutas), "frutas.")

adicionar(frutas, "papaia")
escrever(frutas)

para cada fruta em frutas faça
  escrever("Gosto de", fruta)
fim`,
      },
      {
        titulo: 'Média das notas',
        resumo: 'Somar e calcular a média de uma lista.',
        codigo: `notas = [14, 16.5, 12, 18, 15]

escrever("Notas:", notas)
escrever("Maior nota:", maximo(notas))
escrever("Menor nota:", minimo(notas))
escrever("Média:", arredondar(media(notas), 1))
escrever("Ordenadas:", ordenar(notas))`,
      },
      {
        titulo: 'Dicionários',
        resumo: 'Guardar informação com nomes (chaves).',
        codigo: `aluno = {
  nome: "Tomás",
  idade: 15,
  cidade: "Maputo"
}

escrever(aluno.nome, "tem", aluno.idade, "anos e vive em", aluno.cidade)

aluno.turma = "9ª B"
para cada chave em aluno faça
  escrever(chave, "→", aluno[chave])
fim`,
      },
    ],
  },
  {
    grupo: 'Funções',
    itens: [
      {
        titulo: 'Criar funções',
        resumo: 'Dar um nome a um bloco de código e reutilizá-lo.',
        codigo: `função saudar(nome)
  escrever("Olá,", nome + "! Bem-vindo.")
fim

função somar(a, b)
  retornar a + b
fim

saudar("Lurdes")
saudar("Carlos")
escrever("5 + 7 =", somar(5, 7))`,
      },
      {
        titulo: 'Fatorial',
        resumo: 'Uma função que se chama a si própria.',
        codigo: `função fatorial(n)
  se n <= 1 então
    retornar 1
  fim
  retornar n * fatorial(n - 1)
fim

para i de 1 até 10 faça
  escrever(i + "! =", fatorial(i))
fim`,
      },
    ],
  },
  {
    grupo: 'Projetos',
    itens: [
      {
        titulo: 'Troco em meticais',
        resumo: 'Calcular as notas e moedas para dar o troco.',
        codigo: `valores = [1000, 500, 200, 100, 50, 20, 10, 5, 2, 1]

preco = lerNumero("Preço da compra (MT):")
pago = lerNumero("Valor pago (MT):")

se pago < preco então
  escrever("Falta pagar", preco - pago, "MT.")
senão
  troco = pago - preco
  escrever("Troco:", troco, "MT")
  para cada v em valores faça
    quantos = inteiro(troco / v)
    se quantos > 0 então
      escrever(" ", quantos, "x", v, "MT")
      troco = troco - quantos * v
    fim
  fim
fim`,
      },
      {
        titulo: 'Lista de compras',
        resumo: 'Um pequeno programa com menu.',
        codigo: `compras = []

enquanto verdadeiro faça
  escrever("")
  escrever("1 - Adicionar produto")
  escrever("2 - Ver lista")
  escrever("3 - Sair")
  opcao = ler("Escolhe uma opção:")

  se opcao == 1 então
    produto = lerTexto("Nome do produto:")
    adicionar(compras, produto)
    escrever("✔", produto, "adicionado.")
  senão se opcao == 2 então
    se tamanho(compras) == 0 então
      escrever("A lista está vazia.")
    senão
      para i de 1 até tamanho(compras) faça
        escrever(i + ".", compras[i])
      fim
    fim
  senão se opcao == 3 então
    escrever("Até logo!")
    interromper
  senão
    escrever("Opção inválida.")
  fim
fim`,
      },
      {
        titulo: 'Calculadora de IMC',
        resumo: 'Índice de Massa Corporal com decisões.',
        codigo: `peso = lerNumero("Peso (kg):")
altura = lerNumero("Altura (m), por exemplo 1,70:")

imc = peso / (altura ^ 2)
escrever("O teu IMC é", arredondar(imc, 1))

se imc < 18.5 então
  escrever("Abaixo do peso.")
senão se imc < 25 então
  escrever("Peso normal.")
senão se imc < 30 então
  escrever("Excesso de peso.")
senão
  escrever("Obesidade.")
fim`,
      },
    ],
  },
];

/* Referência rápida */
window.REFERENCIA = {
  palavras: [
    ['escrever(...)', 'Mostra valores na consola'],
    ['ler("pergunta")', 'Pergunta e devolve a resposta'],
    ['se ... então', 'Executa se a condição for verdadeira'],
    ['senão se / senão', 'Alternativas ao "se"'],
    ['fim', 'Fecha um bloco (se, enquanto, para, função)'],
    ['repetir N vezes', 'Repete um bloco N vezes'],
    ['para i de 1 até 10', 'Conta de um número até outro'],
    ['passo 2', 'Muda o salto da contagem'],
    ['para cada x em lista', 'Percorre cada elemento'],
    ['enquanto ... faça', 'Repete enquanto for verdadeiro'],
    ['interromper', 'Sai do ciclo imediatamente'],
    ['continuar', 'Salta para a próxima volta'],
    ['função nome(a, b)', 'Cria uma função'],
    ['retornar valor', 'Devolve um resultado da função'],
    ['e, ou, não', 'Combinam condições'],
    ['verdadeiro, falso', 'Valores lógicos'],
    ['nulo', 'Ausência de valor'],
    ['# comentário', 'Nota ignorada pelo computador'],
  ],
  operadores: [
    ['+  -  *  /', 'Somar, subtrair, multiplicar, dividir'],
    ['%  ou  mod', 'Resto da divisão'],
    ['^', 'Potência (2 ^ 3 = 8)'],
    ['==  !=', 'Igual, diferente'],
    ['<  >  <=  >=', 'Menor, maior, menor ou igual, maior ou igual'],
    ['=', 'Guarda um valor numa variável'],
    ['+=  -=', 'Soma ou subtrai ao valor atual'],
  ],
  funcoes: [
    ['Entrada e saída', [
      ['escrever(a, b, ...)', 'mostra valores separados por espaço'],
      ['ler(pergunta)', 'devolve a resposta (números são convertidos)'],
      ['lerNumero(pergunta)', 'insiste até receber um número'],
      ['lerTexto(pergunta)', 'devolve sempre texto'],
      ['limpar()', 'limpa a consola'],
      ['esperar(segundos)', 'faz uma pausa'],
    ]],
    ['Números', [
      ['arredondar(x, casas)', 'arredonda um número'],
      ['inteiro(x)', 'parte inteira'],
      ['raiz(x)', 'raiz quadrada'],
      ['absoluto(x)', 'valor sem sinal'],
      ['aleatorio(min, max)', 'número inteiro ao acaso'],
      ['maximo(...) / minimo(...)', 'maior / menor valor'],
      ['numero(texto)', 'converte texto em número'],
      ['formatar(x, casas)', 'texto com casas decimais fixas'],
      ['PI', 'o número 3.14159...'],
    ]],
    ['Textos', [
      ['tamanho(t)', 'número de letras'],
      ['maiusculas(t) / minusculas(t)', 'muda as letras'],
      ['parte(t, início, fim)', 'pedaço de um texto'],
      ['substituir(t, a, b)', 'troca a por b'],
      ['dividir(t, separador)', 'transforma em lista'],
      ['contem(t, x)', 'verdadeiro se contém x'],
      ['aparar(t)', 'tira espaços do início e do fim'],
      ['texto(x)', 'converte em texto'],
    ]],
    ['Listas', [
      ['lista[1]', 'primeiro elemento (posições começam em 1)'],
      ['tamanho(lista)', 'número de elementos'],
      ['adicionar(lista, x)', 'acrescenta no fim'],
      ['inserir(lista, pos, x)', 'acrescenta numa posição'],
      ['remover(lista, pos)', 'tira e devolve um elemento'],
      ['contem(lista, x) / posicao(lista, x)', 'procura um valor'],
      ['ordenar(lista) / inverter(lista)', 'nova lista ordenada / ao contrário'],
      ['soma(lista) / media(lista)', 'total / média'],
      ['juntar(lista, sep)', 'transforma em texto'],
      ['sequencia(1, 10)', 'lista de 1 a 10'],
    ]],
    ['Dicionários e outros', [
      ['d.chave  ou  d["chave"]', 'lê um valor'],
      ['chaves(d) / valores(d)', 'listas de chaves / valores'],
      ['tipo(x)', '"número", "texto", "lista"...'],
      ['data() / hora() / ano()', 'data e hora atuais'],
    ]],
  ],
};
