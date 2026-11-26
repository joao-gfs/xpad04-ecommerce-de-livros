import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RotaProtegida } from './components/RotaProtegida';
import { CadastroPage } from './pages/CadastroPage';
import { CarrinhoPage } from './pages/CarrinhoPage';
import { CatalogoPage } from './pages/CatalogoPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { LivroPage } from './pages/LivroPage';
import { LoginPage } from './pages/LoginPage';
import { PedidosPage } from './pages/PedidosPage';
import { PedidoDetalhePage } from './pages/PedidoDetalhePage';
import { EstadoPagina } from './components/EstadoPagina';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<CatalogoPage />} />
        <Route path="livros/:id" element={<LivroPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="cadastro" element={<CadastroPage />} />
        <Route
          path="carrinho"
          element={
            <RotaProtegida>
              <CarrinhoPage />
            </RotaProtegida>
          }
        />
        <Route
          path="checkout"
          element={<RotaProtegida><CheckoutPage /></RotaProtegida>}
        />
        <Route
          path="pedidos/:id"
          element={<RotaProtegida><PedidoDetalhePage /></RotaProtegida>}
        />
        <Route
          path="pedidos"
          element={
            <RotaProtegida>
              <PedidosPage />
            </RotaProtegida>
          }
        />
        <Route path="*" element={<EstadoPagina titulo="Página não encontrada" texto="Confira o endereço ou volte ao catálogo." />} />
      </Route>
    </Routes>
  );
}
