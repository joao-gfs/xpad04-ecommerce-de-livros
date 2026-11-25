import { useParams } from 'react-router-dom';

// TODO:
//  - catalogoApi.livro(id): capa, título, autores, descrição, editora, preço
//  - disponibilidade: `disponivel` / `estoque` (vem do PostgreSQL)
//  - botão "Adicionar ao carrinho" -> carrinhoApi.adicionar(id); se não logado, mandar para /login
export function LivroPage() {
  const { id } = useParams();
  return (
    <section>
      <h1>Livro</h1>
      <p className="todo">TODO: detalhe do livro {id}.</p>
    </section>
  );
}
