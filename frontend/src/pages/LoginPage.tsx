// TODO:
//  - formulário e-mail + senha -> authApi.login(...)
//  - em sucesso: useAuth().entrar(sessao) e navegar para location.state?.de ?? '/'
//  - mostrar ApiError.message em caso de 401
export function LoginPage() {
  return (
    <section>
      <h1>Entrar</h1>
      <p className="todo">TODO: formulário de login.</p>
    </section>
  );
}
