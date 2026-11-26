import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { mensagemApi } from '../api/erros';
import { useAuth } from '../auth/AuthContext';
import { destinoAposLogin, validarConta } from '../auth/conta';
import { CampoFormulario } from './CampoFormulario';
import { Carregamento, Mensagem } from './EstadoPagina';
import { Icone } from './Icone';

export function FormularioConta({ cadastro = false }: { cadastro?: boolean }) {
  const { usuario, carregando, entrar } = useAuth();
  const location = useLocation();
  const destino = destinoAposLogin(location.state);
  const [erros, setErros] = useState<ReturnType<typeof validarConta>>({});
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);
  const envio = useRef(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (envio.current) return;
    const formulario = evento.currentTarget;
    const dados = new FormData(formulario);
    const campos = {
      nome: String(dados.get('nome') ?? '').trim(),
      email: String(dados.get('email') ?? '').trim().toLowerCase(),
      senha: String(dados.get('senha') ?? ''),
      confirmarSenha: String(dados.get('confirmarSenha') ?? ''),
    };
    setErro('');
    const validacao = validarConta(campos, cadastro);
    setErros(validacao);
    const primeiroErro = Object.keys(validacao)[0];
    if (primeiroErro) {
      const campo = formulario.elements.namedItem(primeiroErro);
      if (campo instanceof HTMLInputElement) campo.focus();
      return;
    }
    envio.current = true;
    setEnviando(true);
    try {
      const { nome, email, senha } = campos;
      const sessao = cadastro ? await authApi.cadastro({ nome, email, senha }) : await authApi.login({ email, senha });
      entrar(sessao);
    } catch (falha) {
      setErro(mensagemApi(falha, 'Não foi possível concluir. Verifique a conexão e tente novamente.', 'O serviço de autenticação ainda não está disponível.'));
    } finally {
      envio.current = false;
      setEnviando(false);
    }
  }

  if (carregando) return <Carregamento texto="Verificando sua sessão…" />;
  if (usuario) return <Navigate to={destino} replace />;

  return (
    <section className="conta-painel painel" aria-labelledby="titulo-conta">
      <div className="conta-cabecalho">
        <span className="conta-icone"><Icone nome="usuario" /></span>
        <h1 id="titulo-conta" className="titulo-pagina">{cadastro ? 'Criar conta' : 'Entrar'}</h1>
        <p>{cadastro ? 'Crie sua conta para acompanhar suas próximas leituras.' : 'Acesse sua conta para continuar.'}</p>
      </div>

      <form className="conta-formulario" noValidate onSubmit={enviar} aria-busy={enviando}>
        {erro && <Mensagem>{erro}</Mensagem>}
        {cadastro && <CampoFormulario name="nome" rotulo="Nome" autoComplete="name" required erro={erros.nome} />}
        <CampoFormulario name="email" type="email" rotulo="E-mail" autoComplete="email" required erro={erros.email} />
        <CampoFormulario name="senha" type="password" rotulo="Senha" autoComplete={cadastro ? 'new-password' : 'current-password'} required erro={erros.senha} dica={cadastro ? 'Pelo menos 6 caracteres.' : undefined} />
        {cadastro && <CampoFormulario name="confirmarSenha" type="password" rotulo="Confirme a senha" autoComplete="new-password" required erro={erros.confirmarSenha} />}
        <button className="botao" type="submit" disabled={enviando}>{cadastro ? 'Criar conta' : 'Entrar'}</button>
        {enviando && <Carregamento texto={cadastro ? 'Criando sua conta…' : 'Entrando…'} />}
      </form>

      <p className="conta-alternativa">
        {cadastro ? 'Já tem uma conta? ' : 'Ainda não tem conta? '}
        <Link to={cadastro ? '/login' : '/cadastro'} state={{ de: destino }}>{cadastro ? 'Entrar' : 'Criar conta'}</Link>
      </p>
    </section>
  );
}
