import assert from 'node:assert/strict';
import test from 'node:test';
import { destinoAposLogin, validarConta } from '../src/auth/conta.ts';

const campos = { nome: 'Leitora Teste', email: 'leitora@example.test', senha: 'leitura123', confirmarSenha: 'leitura123' };

test('cadastro exige nome, e-mail e senha de acordo com o contrato', () => {
  assert.deepEqual(validarConta(campos, true), {});
  const erros = validarConta({ nome: ' A ', email: 'invalido', senha: '12345', confirmarSenha: 'outra' }, true);
  assert.deepEqual(Object.keys(erros), ['nome', 'email', 'senha', 'confirmarSenha']);
});

test('login exige e-mail e senha, sem aplicar as regras de criação de conta', () => {
  assert.deepEqual(validarConta({ ...campos, nome: '', senha: '1', confirmarSenha: '' }, false), {});
  assert.ok(validarConta({ ...campos, senha: '' }, false).senha);
});

test('o redirecionamento da sessão mantém o caminho e os filtros internos', () => {
  for (const de of ['/checkout', '/pedidos/42', '/livros/meu-livro', '/?categoria=Ficção#catalogo']) {
    assert.equal(destinoAposLogin({ de }), de);
  }
});

test('entrada sem destino válido leva ao catálogo', () => {
  for (const de of ['//exemplo.test', 'https://exemplo.test', '/\\exemplo.test', '/login', '/cadastro', '/api/pedidos']) {
    assert.equal(destinoAposLogin({ de }), '/');
  }
  assert.equal(destinoAposLogin(undefined), '/');
});
