/**
 * Avaliador das fórmulas que ficam no banco da Receita.
 *
 * Porte de `domain/service/calculotributo/AvaliadorExpressaoAritmetica.java`.
 *
 * A calculadora oficial não tem as contas escritas no código: elas ficam na
 * tabela TRATAMENTO_TRIBUTARIO, como texto. Exemplos reais:
 *   "aliquota*(1-percentualReducao)*(1-pRedutorCompraGov/100)"
 *   "baseCalculoInformada-impostoSeletivoInformado+impostoSeletivoCalculado"
 *   "baseCalculo*aliquotaEfetiva"
 * O Java usa a biblioteca JEXL com aritmética BigDecimal. Aqui fazemos o mesmo
 * com um leitor pequeno, que só aceita o que essas fórmulas usam: números,
 * nomes de variáveis, + - * /, sinal de menos e parênteses.
 * Soma, subtração e multiplicação são exatas; a divisão usa 34 dígitos.
 */
import { D, type Dec, dividir } from "./decimal.ts";
import { ErroPorte } from "./erros.ts";

type Token = { tipo: "num" | "nome" | "op"; valor: string };

function separar(expressao: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expressao.length) {
    const c = expressao[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < expressao.length && /[0-9.]/.test(expressao[j])) j++;
      tokens.push({ tipo: "num", valor: expressao.slice(i, j) });
      i = j;
    } else if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < expressao.length && /[A-Za-z0-9_]/.test(expressao[j])) j++;
      tokens.push({ tipo: "nome", valor: expressao.slice(i, j) });
      i = j;
    } else if ("+-*/()".includes(c)) {
      tokens.push({ tipo: "op", valor: c });
      i++;
    } else {
      throw new ErroPorte(`Caractere inesperado na expressão "${expressao}": ${c}`);
    }
  }
  return tokens;
}

/**
 * Avalia a expressão com as variáveis dadas. Como no Java:
 *  - se a expressão é só o nome de uma variável, devolve o valor dela;
 *  - variável desconhecida é erro (o JEXL roda em modo "strict");
 *  - o resultado não é arredondado aqui (quem chama arredonda uma vez).
 */
export function avaliar(expressao: string, variaveis: Record<string, Dec>): Dec {
  const limpa = expressao.trim();
  if (Object.hasOwn(variaveis, limpa)) return variaveis[limpa];

  const tokens = separar(expressao);
  let pos = 0;
  const olhar = () => tokens[pos];
  const consumir = () => tokens[pos++];

  // soma := produto (('+'|'-') produto)*
  function soma(): Dec {
    let r = produto();
    while (olhar()?.tipo === "op" && (olhar().valor === "+" || olhar().valor === "-")) {
      const op = consumir().valor;
      const d = produto();
      r = op === "+" ? r.plus(d) : r.minus(d);
    }
    return r;
  }
  // produto := unario (('*'|'/') unario)*
  function produto(): Dec {
    let r = unario();
    while (olhar()?.tipo === "op" && (olhar().valor === "*" || olhar().valor === "/")) {
      const op = consumir().valor;
      const d = unario();
      if (op === "*") {
        r = r.times(d);
      } else {
        if (d.isZero()) throw new ErroPorte("Division by zero");
        r = dividir(r, d)!;
      }
    }
    return r;
  }
  function unario(): Dec {
    if (olhar()?.tipo === "op" && olhar().valor === "-") {
      consumir();
      return unario().negated();
    }
    return primario();
  }
  function primario(): Dec {
    const t = consumir();
    if (!t) throw new ErroPorte(`Expressão incompleta: "${expressao}"`);
    if (t.tipo === "num") return new D(t.valor);
    if (t.tipo === "nome") {
      if (!Object.hasOwn(variaveis, t.valor)) {
        throw new ErroPorte(`Variável desconhecida "${t.valor}" na expressão "${expressao}"`);
      }
      return variaveis[t.valor];
    }
    if (t.valor === "(") {
      const r = soma();
      const fecha = consumir();
      if (!fecha || fecha.valor !== ")") throw new ErroPorte(`Parêntese sem fechar em "${expressao}"`);
      return r;
    }
    throw new ErroPorte(`Símbolo inesperado "${t.valor}" em "${expressao}"`);
  }

  const resultado = soma();
  if (pos !== tokens.length) throw new ErroPorte(`Sobrou texto na expressão "${expressao}"`);
  return resultado;
}
