// ============================================================
// CONTROLLER: useClienteController (CORRIGIDO)
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import { RestauranteModel } from '../models/restauranteModel';
import { ProdutoModel } from '../models/produtoModel';
import { PedidoModel } from '../models/pedidoModel';
import { ItensPedidoModel } from '../models/itensPedidoModel';
import { ClienteModel } from '../models/clienteModel';
import { AuthModel } from '../models/authModel';
import { PaymentService } from '../services/paymentservice';

const ENDERECO_PADRAO = 'Rua Augusta, 123 - Consolação';

export function useClienteController() {
  // ---- Dados de domínio ----
  const [restaurantes, setRestaurantes] = useState([]);
  const [produtos, setProdutos] = useState([]);

  // ---- Autenticação ----
  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // ---- Navegação ----
  const [pedidoAtivoId, setPedidoAtivoId] = useState(null);
  const [verHistorico, setVerHistorico] = useState(false);
  const [precisaLogar, setPrecisaLogar] = useState(false);

  // ---- Carrinho ----
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [carrinhoPendente, setCarrinhoPendente] = useState(null);

  // ---- Checkout ----
  const [checkoutAberto, setCheckoutAberto] = useState(false);

  // ---- Filtros / UI ----
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [restauranteExpandido, setRestauranteExpandido] = useState(null);

  // ---- Estados de loading e PIX ----
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState(null);

  // ----------------------------------------------------------
  // Inicialização
  // ----------------------------------------------------------
  useEffect(() => {
    carregarDados();
    verificarSessao();
  }, []);

  const carregarDados = async () => {
    try {
      const [rests, prods] = await Promise.all([
        RestauranteModel.listarTodos(),
        ProdutoModel.listarTodos(),
      ]);
      setRestaurantes(rests ?? []);
      setProdutos(prods ?? []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  };

  const verificarSessao = async () => {
    const sessao = await AuthModel.obterSessao();
    if (sessao) await _hidratar(sessao.user);
  };

  const _hidratar = async (user) => {
    try {
      const dados = await ClienteModel.buscarPorId(user.id);
      setUsuarioLogado({
        ...user,
        nome: dados?.nome ?? user.user_metadata?.nome ?? 'Cliente',
        endereco: dados?.endereco,
        complemento: dados?.complemento,
        telefone: dados?.telefone ?? user.phone,
      });
    } catch {
      setUsuarioLogado(user);
    }
  };

  const loginSucesso = useCallback(
    async (user) => {
      await _hidratar(user);
      setPrecisaLogar(false);

      if (carrinhoPendente) {
        setCarrinhoPendente(null);
        setCheckoutAberto(true);
      } else {
        setCarrinhoAberto(true);
      }
    },
    [carrinhoPendente]
  );

  const logout = () => {
    setUsuarioLogado(null);
  };

  // ----------------------------------------------------------
  // Carrinho
  // ----------------------------------------------------------
  const adicionarAoCarrinho = (produto, restId) => {
    if (carrinho.length > 0 && carrinho[0].restauranteId !== restId) {
      if (!window.confirm('Sua sacola já tem itens de outro local. Limpar?')) return;
      setCarrinho([{ ...produto, quantidade: 1, restauranteId: restId }]);
      return;
    }
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === produto.id);
      if (existe)
        return prev.map((i) => (i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i));
      return [...prev, { ...produto, quantidade: 1, restauranteId: restId }];
    });
  };

  const removerDoCarrinho = (produtoId) => {
    setCarrinho(prev =>
      prev
        .map(i => i.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i)
        .filter(i => i.quantidade > 0)
    );
  };

  const limparCarrinho = () => setCarrinho([]);

  const calcularTotal = (itens = carrinho) =>
    itens.reduce((acc, item) => acc + item.preco * item.quantidade, 0);

  // ----------------------------------------------------------
  // Iniciar Checkout
  // ----------------------------------------------------------
  const iniciarCheckout = () => {
    if (carrinho.length === 0) {
      alert('Carrinho vazio!');
      return;
    }
    if (!usuarioLogado) {
      setCarrinhoPendente([...carrinho]);
      setPrecisaLogar(true);
      setCarrinhoAberto(false);
      return;
    }
    setCarrinhoAberto(false);
    setCheckoutAberto(true);
  };

  // ----------------------------------------------------------
  // Finalizar pedido (CORRIGIDO - Passa carrinho e tipoEntrega)
  // ----------------------------------------------------------
  const finalizarPedido = async ({ 
    tipoEntrega, 
    formaPagamento, 
    total, 
    dadosCartao = null,
    acao = null,
    pedidoId = null
  }) => {
    // Se for ação de acompanhar, apenas navega
    if (acao === 'acompanhar') {
      setCheckoutAberto(false);
      setCarrinho([]);
      setCarrinhoPendente(null);
      setPedidoAtivoId(pedidoId);
      return { sucesso: true, acao: 'acompanhar' };
    }

    const usuario = usuarioLogado;
    
    if (!usuario) {
      setCarrinhoPendente([...carrinho]);
      setPrecisaLogar(true);
      setCarrinhoAberto(false);
      return { sucesso: false, mensagem: 'Usuário não logado' };
    }

    try {
      setLoading(true);
      
      // 1. Criar o pedido
      const pedido = await PedidoModel.criar({
        restaurante_id: carrinho[0].restauranteId,
        cliente_nome: usuario.nome ?? 'Cliente',
        cliente_id: usuario.id,
        total,
        forma_pagamento: formaPagamento,
        tipo_entrega: tipoEntrega,
        status: 'Aguardando',
        telefone: usuario.telefone ?? usuario.phone,
        pin_entrega: Math.floor(1000 + Math.random() * 9000).toString(),
        email: usuario.email,
        endereco: tipoEntrega === 'Retirada' 
          ? 'Retirada no restaurante' 
          : (usuario.endereco ?? ENDERECO_PADRAO)
      });

      // 2. Inserir itens do pedido
      await ItensPedidoModel.inserirVarios(
        carrinho.map(item => ({
          pedido_id: pedido.id,
          produto_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco
        }))
      );

      // 3. Processar pagamento - AGORA COM CARRINHO E TIPO ENTREGA!
      const resultadoPagamento = await PaymentService.processarPagamento({
        pedidoId: pedido.id,
        formaPagamento: formaPagamento,
        valor: total,
        dadosCartao: dadosCartao,
        usuarioLogado: usuario,
        carrinho: carrinho,        // ✅ ADICIONADO
        tipoEntrega: tipoEntrega   // ✅ ADICIONADO
      });

      // 4. Atualizar status do pedido baseado no resultado
      if (resultadoPagamento.sucesso) {
        await PedidoModel.atualizarStatus(pedido.id, 'Confirmado');
        
        return {
          sucesso: true,
          pedido: pedido,
          pagamento: resultadoPagamento.pagamento,
          pixCode: resultadoPagamento.pixCode,
          qrcodeUrl: resultadoPagamento.qrcodeUrl,
          expiracao: resultadoPagamento.expiracao,
          preferenceId: resultadoPagamento.preferenceId, // ✅ Para Mercado Pago
          initPoint: resultadoPagamento.initPoint         // ✅ Para Mercado Pago
        };
      } else {
        await PedidoModel.atualizarStatus(pedido.id, 'Pagamento Recusado');
        
        return {
          sucesso: false,
          mensagem: resultadoPagamento.mensagem || 'Pagamento recusado. Tente novamente.',
          pedido: pedido
        };
      }

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      return {
        sucesso: false,
        mensagem: `Erro ao processar pedido: ${error.message}`
      };
    } finally {
      setLoading(false);
    }
  };

  const toggleRestaurante = (id) =>
    setRestauranteExpandido((prev) => (prev === id ? null : id));

  // ----------------------------------------------------------
  // RETORNO
  // ----------------------------------------------------------
  return {
    restaurantes,
    produtos,
    usuarioLogado,
    pedidoAtivoId, 
    setPedidoAtivoId,
    verHistorico, 
    setVerHistorico,
    precisaLogar,
    carrinho,
    carrinhoAberto, 
    setCarrinhoAberto,
    adicionarAoCarrinho,
    removerDoCarrinho,
    limparCarrinho,
    calcularTotal,
    checkoutAberto, 
    setCheckoutAberto,
    iniciarCheckout,
    finalizarPedido,
    busca, 
    setBusca,
    categoriaAtiva, 
    setCategoriaAtiva,
    restauranteExpandido,
    toggleRestaurante,
    loginSucesso,
    logout,
    loading, 
    pixData,
    setPixData
  };
}