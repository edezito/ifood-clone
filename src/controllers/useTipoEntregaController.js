// ============================================================
// CONTROLLER: useTipoEntregaController
// Responsabilidade: Gerenciar a escolha entre Entrega e Retirada,
// calcular frete e preparar o payload para o checkout.
// ============================================================
import { useState, useEffect, useCallback } from 'react';
// Importe seus models reais aqui. Exemplo:
// import { CarrinhoModel } from '../models/carrinhoModel';
// import { EnderecoModel } from '../models/enderecoModel';

export function useTipoEntregaController(carrinhoId) {
  // Estados principais
  const [tipoSelecionado, setTipoSelecionado] = useState('entrega'); // 'entrega' | 'retirada'
  const [taxaFrete, setTaxaFrete] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  
  // Estados auxiliares (endereços e UI)
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Valor fixo simulado de frete (na prática, viria do Model ou da loja)
  const FRETE_PADRAO = 5.99;

  // Carrega os dados iniciais do carrinho e endereços do usuário
  const carregarDados = useCallback(async () => {
    if (!carrinhoId) return;
    
    try {
      setLoading(true);
      // Exemplo de chamadas aos seus Models reais:
      // const [carrinhoData, enderecosData] = await Promise.all([
      //   CarrinhoModel.buscarPorId(carrinhoId),
      //   EnderecoModel.buscarEnderecosDoUsuario()
      // ]);
      
      // Dados simulados para o exemplo:
      const carrinhoData = { subtotal: 45.00, tipoEntrega: 'entrega' };
      const enderecosData = [{ id: 1, logradouro: 'Rua das Flores, 123', principal: true }];

      setSubtotal(carrinhoData.subtotal);
      setTipoSelecionado(carrinhoData.tipoEntrega || 'entrega');
      setTaxaFrete(carrinhoData.tipoEntrega === 'entrega' ? FRETE_PADRAO : 0);
      
      setEnderecos(enderecosData);
      const enderecoPrincipal = enderecosData.find(e => e.principal);
      if (enderecoPrincipal) setEnderecoSelecionado(enderecoPrincipal.id);

    } catch (error) {
      console.error('❌ [Controller - TipoEntrega] Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [carrinhoId]);

  // Efeito inicial
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Handler para trocar o tipo de entrega
  const selecionarTipo = useCallback((novoTipo) => {
    setTipoSelecionado(novoTipo);
    
    // Regra de negócio: Retirada não tem frete
    if (novoTipo === 'retirada') {
      setTaxaFrete(0);
    } else {
      setTaxaFrete(FRETE_PADRAO);
    }
  }, []);

  // Dados derivados
  const totalPedido = subtotal + taxaFrete;
  const podeAvancar = tipoSelecionado === 'retirada' || (tipoSelecionado === 'entrega' && enderecoSelecionado !== null);

  // Actions disponíveis para a View
  const actions = {
    selecionarTipo,
    
    selecionarEndereco: (id) => {
      setEnderecoSelecionado(id);
    },

    confirmarSelecao: async () => {
      if (!podeAvancar) return;
      
      try {
        setSalvando(true);
        console.log('📡 [Controller - TipoEntrega] Salvando seleção:', {
          carrinhoId,
          tipoEntrega: tipoSelecionado,
          taxaFrete,
          enderecoId: tipoSelecionado === 'entrega' ? enderecoSelecionado : null
        });

        // Exemplo de chamada real ao Model para persistir a escolha no banco:
        // await CarrinhoModel.atualizarTipoEntrega(carrinhoId, {
        //   tipoEntrega: tipoSelecionado,
        //   taxaFrete,
        //   enderecoId: tipoSelecionado === 'entrega' ? enderecoSelecionado : null
        // });

        return true; // Retorna true para a View saber que pode ir para a próxima tela (Pagamento)
      } catch (error) {
        console.error('❌ [Controller - TipoEntrega] Erro ao salvar:', error);
        throw error;
      } finally {
        setSalvando(false);
      }
    }
  };

  return {
    // Estado
    tipoSelecionado,
    enderecos,
    enderecoSelecionado,
    loading,
    salvando,
    
    // Dados Processados/Derivados
    subtotal,
    taxaFrete,
    totalPedido,
    podeAvancar,
    
    // Actions
    ...actions
  };
}