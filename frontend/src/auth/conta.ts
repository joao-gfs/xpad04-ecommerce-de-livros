export interface CamposConta {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

export function validarConta(campos: CamposConta, cadastro: boolean) {
  const erros: Partial<Record<keyof CamposConta, string>> = {};
  if (cadastro && campos.nome.trim().length < 2) erros.nome = 'Informe um nome com pelo menos 2 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campos.email.trim())) erros.email = 'Informe um e-mail válido.';
  if (!campos.senha) erros.senha = 'Informe a senha.';
  else if (cadastro && campos.senha.length < 6) erros.senha = 'A senha precisa ter pelo menos 6 caracteres.';
  if (cadastro && (!campos.confirmarSenha || campos.confirmarSenha !== campos.senha)) {
    erros.confirmarSenha = 'Repita a mesma senha.';
  }
  return erros;
}

export function destinoAposLogin(estado: unknown): string {
  if (!estado || typeof estado !== 'object' || !('de' in estado) || typeof estado.de !== 'string') return '/';
  const destino = estado.de;
  const caminho = destino.split(/[?#]/, 1)[0];
  const rotaDaLoja = /^\/(?:livros\/[^/]+|carrinho|checkout|pedidos(?:\/\d+)?)?$/;
  return rotaDaLoja.test(caminho) && !/[\\\u0000-\u001f]/.test(destino) ? destino : '/';
}
