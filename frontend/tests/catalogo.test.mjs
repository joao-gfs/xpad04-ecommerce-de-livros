import assert from 'node:assert/strict';
import test from 'node:test';
import { consultarCatalogo } from '../src/catalogo/consulta.ts';
import { lerFiltros, lerModoCatalogo, mudarFiltro } from '../src/catalogo/filtros.ts';
import { listarCategoriasDemonstracao, listarLivrosDemonstracao, obterLivroDemonstracao } from '../src/mocks/catalogo.ts';

const listar = (filtro = {}) => listarLivrosDemonstracao({ busca: '', categoria: '', pagina: 1, porPagina: 6, ...filtro });

test('demonstração automática exige configuração explícita de desenvolvimento', () => {
  assert.equal(lerModoCatalogo(true, 'true'), 'automatico');
  assert.equal(lerModoCatalogo(true), 'api');
  assert.equal(lerModoCatalogo(true, 'false'), 'api');
  assert.equal(lerModoCatalogo(false, 'true'), 'api');
});

test('páginas inválidas da URL nunca são enviadas ao catálogo', () => {
  for (const valor of ['', '0', '-1', '1.5', 'Infinity', 'NaN', '1e2', '9007199254740992', 'texto']) {
    assert.equal(lerFiltros(new URLSearchParams({ pagina: valor })).pagina, 1, `Página inválida: ${valor}`);
  }
  assert.equal(lerFiltros(new URLSearchParams('pagina=3')).pagina, 3);
});

test('busca e categoria são preservadas sem espaços nas extremidades', () => {
  const filtros = lerFiltros(new URLSearchParams({ busca: '  Machado de Assis  ', categoria: ' Romance ' }));
  assert.equal(filtros.busca, 'Machado de Assis');
  assert.equal(filtros.categoria, 'Romance');
});

test('mudar busca ou categoria volta à primeira página e preserva os filtros da URL', () => {
  const original = new URLSearchParams('modo=demo&busca=Machado&categoria=Romance&pagina=4');
  const alterado = mudarFiltro(original, 'busca', '  Jane Austen  ');
  assert.equal(alterado.get('busca'), 'Jane Austen');
  assert.equal(alterado.get('categoria'), 'Romance');
  assert.equal(alterado.has('modo'), false);
  assert.equal(lerFiltros(alterado).pagina, 1);
  assert.equal(original.get('pagina'), '4', 'Não modifica os parâmetros atuais do React Router');
  assert.equal(original.get('busca'), 'Machado');
  assert.equal(lerFiltros(mudarFiltro(original, 'categoria', 'Fantasia')).pagina, 1);
});

test('navegar entre páginas mantém a busca e a categoria', () => {
  const params = mudarFiltro(new URLSearchParams('busca=George&categoria=Ficção'), 'pagina', '2');
  const filtros = lerFiltros(params);
  assert.equal(filtros.pagina, 2);
  assert.equal(filtros.busca, 'George');
  assert.equal(filtros.categoria, 'Ficção');
});

test('limpar a busca remove o parâmetro sem remover a categoria', () => {
  const parametros = mudarFiltro(new URLSearchParams('busca=Machado&categoria=Romance&pagina=3'), 'busca', '  ');
  assert.equal(parametros.has('busca'), false);
  assert.equal(parametros.get('categoria'), 'Romance');
  assert.equal(lerFiltros(parametros).pagina, 1);
});

test('a demonstração busca por título ou autor, ignorando caixa e acentos', () => {
  const porTitulo = listar({ busca: 'pequeno principe' });
  assert.equal(porTitulo.total, 1);
  assert.equal(porTitulo.itens[0].titulo, 'O Pequeno Príncipe');
  const porAutor = listar({ busca: 'MACHADO DE ASSIS' });
  assert.ok(porAutor.total > 0);
  assert.ok(porAutor.itens.every((livro) => livro.autores.includes('Machado de Assis')));
});

test('categoria e busca atuam juntas, inclusive quando não há correspondência', () => {
  const encontrados = listar({ busca: 'George Orwell', categoria: 'Ficção' });
  assert.ok(encontrados.total > 0);
  assert.ok(encontrados.itens.every((livro) => livro.categorias.includes('Ficção') && livro.autores.includes('George Orwell')));
  assert.deepEqual(listar({ busca: 'George Orwell', categoria: 'Romance' }).itens, []);
  assert.equal(listar({ busca: 'George Orwell', categoria: 'Romance' }).total, 0);
});

test('paginação tem total consistente e não repete livros entre páginas', () => {
  const primeira = listar();
  const segunda = listar({ pagina: 2 });
  assert.equal(primeira.total, segunda.total);
  assert.equal(primeira.pagina, 1);
  assert.equal(segunda.pagina, 2);
  assert.equal(primeira.porPagina, 6);
  assert.equal(primeira.itens.length, 6);
  assert.equal(segunda.itens.length, 6);
  assert.equal(new Set([...primeira.itens, ...segunda.itens].map((livro) => livro.id)).size, primeira.total);
});

test('página fora do intervalo fica vazia sem inventar resultados', () => {
  const resultado = listar({ pagina: 500 });
  assert.equal(resultado.pagina, 500);
  assert.equal(resultado.total, listar().total);
  assert.deepEqual(resultado.itens, []);
});

test('categorias da demonstração são únicas e cada uma filtra livros existentes', () => {
  const categorias = listarCategoriasDemonstracao();
  assert.ok(categorias.length > 0);
  assert.equal(new Set(categorias).size, categorias.length);
  for (const categoria of categorias) {
    const resultado = listar({ categoria });
    assert.ok(resultado.total > 0);
    assert.ok(resultado.itens.every((livro) => livro.categorias.includes(categoria)));
  }
});

const erroHttp = (status) => Object.assign(new Error(`API respondeu ${status}`), { status });
const pendente = erroHttp(501);
const paginaVazia = { itens: [], total: 0, pagina: 1, porPagina: 6 };
const filtrosPadrao = lerFiltros(new URLSearchParams());

function prepararConsulta(t, categorias, livros) {
  function responder(resposta) {
    if (resposta instanceof Error) throw resposta;
    return resposta;
  }

  const api = {
    categorias: t.mock.fn(async () => responder(categorias)),
    livros: t.mock.fn(async () => responder(livros)),
  };
  const demo = t.mock.fn(async (filtros) => ({
    categorias: listarCategoriasDemonstracao(),
    livros: listarLivrosDemonstracao(filtros),
  }));
  return { api, demo };
}

test('consulta real recebe busca, categoria e página e usa a paginação da API', async (t) => {
  const params = new URLSearchParams({ busca: '  Uma história  ', categoria: 'Ficção', pagina: '2' });
  const filtros = lerFiltros(params);
  const paginaApi = {
    itens: [{ id: 'livro-api', titulo: 'Uma história', autores: ['Autora'], categorias: ['Ficção'], preco: 35 }],
    total: 7, pagina: 2, porPagina: 6,
  };
  const { api, demo } = prepararConsulta(t, ['Ficção'], paginaApi);

  const resultado = await consultarCatalogo(api, filtros, lerModoCatalogo(true, 'true'), demo);

  assert.deepEqual(api.livros.mock.calls[0].arguments, [{ busca: 'Uma história', categoria: 'Ficção', pagina: 2, porPagina: 6 }]);
  assert.equal(api.categorias.mock.callCount(), 1);
  assert.equal(resultado.origem, 'api');
  assert.deepEqual(resultado.livros.dados, paginaApi);
  assert.deepEqual(resultado.categorias.dados, ['Ficção']);
  assert.equal(demo.mock.callCount(), 0);
});

test('dois 501 ativam a demonstração após as duas consultas reais', async (t) => {
  const { api, demo } = prepararConsulta(t, pendente, pendente);
  const params = new URLSearchParams({ busca: 'Machado', categoria: 'Romance' });
  const filtros = lerFiltros(params);

  const resultado = await consultarCatalogo(api, filtros, lerModoCatalogo(true, 'true'), demo);

  assert.equal(api.categorias.mock.callCount(), 1);
  assert.equal(api.livros.mock.callCount(), 1);
  assert.equal(demo.mock.callCount(), 1);
  assert.equal(resultado.origem, 'demo');
  assert.ok(resultado.categorias.dados.includes('Romance'));
  assert.ok(resultado.livros.dados.itens.length > 0);
  assert.ok(resultado.livros.dados.itens.every((livro) => livro.autores.includes('Machado de Assis')));
});

test('produção e desenvolvimento com a demonstração desligada mantêm 501', async (t) => {
  for (const [desenvolvimento, habilitado] of [[false, 'true'], [true, 'false']]) {
    const { api, demo } = prepararConsulta(t, pendente, pendente);
    const modo = lerModoCatalogo(desenvolvimento, habilitado);

    const resultado = await consultarCatalogo(api, filtrosPadrao, modo, demo);

    assert.equal(resultado.origem, 'api');
    assert.equal(resultado.livros.erro, 'nao-implementado');
    assert.equal(resultado.categorias.erro, 'nao-implementado');
    assert.equal(demo.mock.callCount(), 0);
  }
});

test('os detalhes ilustrativos existem para os livros da grade e só para os IDs de demonstração cadastrados', () => {
  for (const livro of listar().itens) {
    const detalhes = obterLivroDemonstracao(livro.id);
    assert.equal(detalhes.titulo, livro.titulo);
    assert.ok(detalhes.descricao);
  }
  assert.equal(obterLivroDemonstracao('livro-real'), null);
  assert.equal(obterLivroDemonstracao('demo-frankenstein').disponivel, false);
});

test('catálogo vazio é um resultado real, inclusive quando categorias retornam 501', async (t) => {
  const { api, demo } = prepararConsulta(t, pendente, paginaVazia);

  const resultado = await consultarCatalogo(api, filtrosPadrao, 'automatico', demo);

  assert.equal(resultado.origem, 'api');
  assert.deepEqual(resultado.livros.dados, paginaVazia);
  assert.equal(resultado.categorias.erro, 'nao-implementado');
  assert.equal(demo.mock.callCount(), 0);
});

test('categorias reais permanecem disponíveis quando a listagem está pendente', async (t) => {
  const { api, demo } = prepararConsulta(t, ['Literatura brasileira'], pendente);

  const resultado = await consultarCatalogo(api, filtrosPadrao, 'automatico', demo);

  assert.equal(resultado.origem, 'api');
  assert.deepEqual(resultado.categorias.dados, ['Literatura brasileira']);
  assert.equal(resultado.livros.erro, 'nao-implementado');
  assert.equal(demo.mock.callCount(), 0);
});

test('falha de rede ou HTTP inesperado impede a demonstração, mesmo com 501 no outro endpoint', async (t) => {
  for (const falha of [new TypeError('Conexão interrompida'), erroHttp(400), erroHttp(404), erroHttp(500), erroHttp(503)]) {
    const { api, demo } = prepararConsulta(t, pendente, falha);
    const resultado = await consultarCatalogo(api, filtrosPadrao, 'automatico', demo);
    assert.equal(resultado.origem, 'api');
    assert.equal(resultado.livros.erro, 'falha');
    assert.equal(demo.mock.callCount(), 0);
  }

  const { api, demo } = prepararConsulta(t, erroHttp(503), pendente);
  const resultado = await consultarCatalogo(api, filtrosPadrao, 'automatico', demo);
  assert.equal(resultado.categorias.erro, 'falha');
  assert.equal(resultado.origem, 'api');
  assert.equal(demo.mock.callCount(), 0);
});

test('JSON fora do contrato mostra erro e preserva o endpoint que funcionou', async (t) => {
  const { api, demo } = prepararConsulta(t, ['Romance'], { itens: null });

  const resultado = await consultarCatalogo(api, filtrosPadrao, 'automatico', demo);

  assert.equal(resultado.origem, 'api');
  assert.equal(resultado.livros.erro, 'falha');
  assert.deepEqual(resultado.categorias.dados, ['Romance']);
  assert.equal(demo.mock.callCount(), 0);
});

test('uma consulta posterior usa a API assim que as rotas ficam disponíveis', async (t) => {
  const { api, demo } = prepararConsulta(t, pendente, pendente);
  assert.equal((await consultarCatalogo(api, filtrosPadrao, 'automatico', demo)).origem, 'demo');

  api.categorias.mock.mockImplementation(async () => ['Romance']);
  api.livros.mock.mockImplementation(async () => paginaVazia);
  const resultado = await consultarCatalogo(api, filtrosPadrao, 'automatico', demo);

  assert.equal(resultado.origem, 'api');
  assert.deepEqual(resultado.livros.dados, paginaVazia);
  assert.equal(demo.mock.callCount(), 1);
});
