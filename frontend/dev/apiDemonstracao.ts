import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import type { Carrinho, Pedido, Usuario } from '../src/api/types';
import { lerFiltros } from '../src/catalogo/filtros';
import { listarCategoriasDemonstracao, listarLivrosDemonstracao, livrosDemonstracao, obterLivroDemonstracao } from '../src/mocks/catalogo';

type Conta = { usuario: Usuario; senha: string };
type Itens = Map<string, number>;

function json(res: ServerResponse, status: number, dados: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(dados));
}

async function lerCorpo(req: IncomingMessage): Promise<Record<string, unknown>> {
  let corpo = '';
  for await (const parte of req) {
    corpo += String(parte);
    if (corpo.length > 16_384) throw new Error('Corpo de requisição muito grande.');
  }
  const dados: unknown = JSON.parse(corpo || '{}');
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) throw new Error('Corpo inválido.');
  return dados as Record<string, unknown>;
}

/** API isolada do Vite. Todo o estado fica em memória e expira ao encerrar a demonstração. */
export function apiDemonstracao(): Plugin {
  const leitor = { id: 1, nome: 'Leitor de demonstração', email: 'leitor@example.test' };
  const contas = new Map<string, Conta>([[leitor.email, { usuario: leitor, senha: 'leitura123' }]]);
  const sessoes = new Map<string, Usuario>();
  const carrinhos = new Map<number, Itens>();
  const historico = new Map<number, Pedido[]>();
  const estoque = new Map(livrosDemonstracao.map(({ id }) => [id, obterLivroDemonstracao(id)?.estoque ?? 0]));
  let ultimoUsuario = 1;
  let ultimoPedido = 0;

  function carrinho(itens: Itens): Carrinho {
    const linhas = Array.from(itens, ([id, quantidade]) => {
      const livro = obterLivroDemonstracao(id)!;
      const subtotal = Math.round(livro.preco * quantidade * 100) / 100;
      return { livroId: id, titulo: livro.titulo, capaUrl: livro.capaUrl ?? null, quantidade, precoUnitario: livro.preco, subtotal };
    });
    return { itens: linhas, total: Math.round(linhas.reduce((soma, item) => soma + item.subtotal, 0) * 100) / 100 };
  }

  function entrar(res: ServerResponse, usuario: Usuario, status: number) {
    const token = `demo-${randomUUID()}`;
    sessoes.set(token, usuario);
    json(res, status, { token, usuario });
  }

  async function atender(req: IncomingMessage, res: ServerResponse) {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const caminho = url.pathname;
    const metodo = req.method;
    const falhar = (status: number, erro: string) => json(res, status, { erro });

    if (metodo === 'GET' && caminho === '/categorias') return json(res, 200, listarCategoriasDemonstracao());
    if (metodo === 'GET' && caminho === '/livros') {
      const filtros = lerFiltros(url.searchParams);
      const porPagina = Number(url.searchParams.get('porPagina') ?? 20);
      if (!Number.isSafeInteger(porPagina) || porPagina < 1 || porPagina > 100) return falhar(400, 'Paginação inválida.');
      return json(res, 200, listarLivrosDemonstracao({ ...filtros, porPagina }));
    }
    if (metodo === 'GET' && caminho.startsWith('/livros/')) {
      const livro = obterLivroDemonstracao(decodeURIComponent(caminho.slice('/livros/'.length)));
      if (!livro) return falhar(404, 'Livro não encontrado.');
      const quantidade = estoque.get(livro.id) ?? 0;
      return json(res, 200, { ...livro, estoque: quantidade, disponivel: quantidade > 0 });
    }

    if (metodo === 'POST' && (caminho === '/auth/login' || caminho === '/auth/cadastro')) {
      const { nome, email, senha } = await lerCorpo(req);
      if (typeof email !== 'string' || typeof senha !== 'string' || !senha) return falhar(400, 'Informe e-mail e senha.');
      const endereco = email.toLowerCase();
      const conta = contas.get(endereco);
      if (caminho === '/auth/login') {
        if (!conta || conta.senha !== senha) return falhar(401, 'E-mail ou senha inválidos.');
        return entrar(res, conta.usuario, 200);
      }
      if (typeof nome !== 'string' || nome.trim().length < 2 || senha.length < 6 || !endereco.endsWith('@example.test')) {
        return falhar(400, 'Use um e-mail fictício @example.test, nome e senha de pelo menos 6 caracteres.');
      }
      if (conta) return falhar(409, 'E-mail já cadastrado.');
      const usuario = { id: ++ultimoUsuario, nome: nome.trim(), email: endereco };
      contas.set(endereco, { usuario, senha });
      return entrar(res, usuario, 201);
    }

    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    const usuario = token ? sessoes.get(token) : undefined;
    if (!usuario) return falhar(401, 'Sessão de demonstração ausente ou expirada.');
    if (metodo === 'GET' && caminho === '/auth/me') return json(res, 200, usuario);

    const itensAtuais = () => carrinhos.get(usuario.id) ?? new Map<string, number>();
    if (metodo === 'GET' && caminho === '/carrinho') return json(res, 200, carrinho(itensAtuais()));
    if (metodo === 'DELETE' && caminho === '/carrinho') {
      carrinhos.delete(usuario.id);
      res.writeHead(204).end();
      return;
    }
    const itemNaRota = caminho.startsWith('/carrinho/itens/') ? decodeURIComponent(caminho.slice('/carrinho/itens/'.length)) : '';
    const adicionando = metodo === 'POST' && caminho === '/carrinho/itens';
    if (adicionando || (itemNaRota && (metodo === 'PATCH' || metodo === 'DELETE'))) {
      const corpo = metodo === 'DELETE' ? {} : await lerCorpo(req);
      const livroId = adicionando ? corpo.livroId : itemNaRota;
      const quantidade = adicionando ? corpo.quantidade ?? 1 : metodo === 'DELETE' ? 0 : corpo.quantidade;
      if (typeof livroId !== 'string' || typeof quantidade !== 'number' || !Number.isSafeInteger(quantidade) || quantidade < (adicionando ? 1 : 0)) {
        return falhar(400, 'Livro ou quantidade inválida.');
      }
      const livro = obterLivroDemonstracao(livroId);
      if (!livro) return falhar(404, 'Livro não encontrado.');
      const itens = itensAtuais();
      const quantidadeFinal = adicionando ? (itens.get(livroId) ?? 0) + quantidade : quantidade;
      if (quantidadeFinal > (estoque.get(livroId) ?? 0)) return falhar(409, `Estoque insuficiente: ${livro.titulo}.`);
      if (quantidadeFinal === 0) itens.delete(livroId);
      else itens.set(livroId, quantidadeFinal);
      carrinhos.set(usuario.id, itens);
      return json(res, adicionando ? 201 : 200, carrinho(itens));
    }

    const pedidos = () => historico.get(usuario.id) ?? [];
    if (metodo === 'GET' && caminho === '/pedidos') return json(res, 200, pedidos());
    if (metodo === 'GET' && caminho.startsWith('/pedidos/')) {
      const pedido = pedidos().find((item) => item.id === Number(caminho.slice('/pedidos/'.length)));
      return pedido ? json(res, 200, pedido) : falhar(404, 'Pedido não encontrado.');
    }
    if (metodo === 'POST' && caminho === '/pedidos') {
      const { metodo: pagamento } = await lerCorpo(req);
      if (pagamento !== 'PIX' && pagamento !== 'CARTAO' && pagamento !== 'BOLETO') return falhar(400, 'Selecione um método de pagamento.');
      const itens = itensAtuais();
      const resumo = carrinho(itens);
      if (!resumo.itens.length) return falhar(400, 'Carrinho vazio.');
      const indisponivel = resumo.itens.find((item) => item.quantidade > (estoque.get(item.livroId) ?? 0));
      if (indisponivel) return falhar(409, `Estoque insuficiente: ${indisponivel.titulo}.`);
      const pedido: Pedido = {
        id: ++ultimoPedido, status: 'CONFIRMADO', criadoEm: new Date().toISOString(), total: resumo.total,
        itens: resumo.itens.map((item) => ({ ...item, capaUrl: item.capaUrl ?? null })),
        pagamento: { metodo: pagamento, status: 'APROVADO', valor: resumo.total },
      };
      for (const [id, quantidade] of itens) estoque.set(id, (estoque.get(id) ?? 0) - quantidade);
      historico.set(usuario.id, [pedido, ...pedidos()]);
      carrinhos.delete(usuario.id);
      return json(res, 201, pedido);
    }
    return falhar(404, 'Rota de demonstração não encontrada.');
  }

  return {
    name: 'livraria-api-demonstracao',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        atender(req, res).catch(() => json(res, 400, { erro: 'Requisição de demonstração inválida.' }));
      });
    },
  };
}
